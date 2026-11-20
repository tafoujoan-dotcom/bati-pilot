import { PaymentGatewayProvider, PaymentGatewayStatus, PaymentTransactionStatus } from '../src/types';

function getAppBaseUrl(): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && envUrl !== 'MY_APP_URL') {
    return envUrl.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export function normalizeCameroonPhone(raw: string): string | null {
  const digits = (raw || '').replace(/[^\d]/g, '');
  let local9 = digits;
  if (digits.startsWith('237') && digits.length === 12) {
    local9 = digits.slice(3);
  } else if (digits.startsWith('00237') && digits.length === 14) {
    local9 = digits.slice(5);
  }
  if (!/^6\d{8}$/.test(local9)) {
    return null;
  }
  return `237${local9}`;
}

export function getPaymentGatewayStatus(): PaymentGatewayStatus {
  const campayConfigured = Boolean(
    process.env.CAMPAY_TOKEN?.trim() ||
      (process.env.CAMPAY_APP_USERNAME?.trim() && process.env.CAMPAY_APP_PASSWORD?.trim())
  );
  const cinetpayConfigured = Boolean(
    process.env.CINETPAY_API_KEY?.trim() && process.env.CINETPAY_SITE_ID?.trim()
  );

  let activeProvider: PaymentGatewayProvider = 'NONE';
  if (campayConfigured) {
    activeProvider = 'CAMPAY';
  } else if (cinetpayConfigured) {
    activeProvider = 'CINETPAY';
  }

  const supportedMethods: string[] = [];
  if (campayConfigured) {
    supportedMethods.push('Orange Money (USSD Push)', 'MTN MoMo (USSD Push)');
  }
  if (cinetpayConfigured) {
    supportedMethods.push('CinetPay (OM, MTN MoMo, Visa/Mastercard)');
  }

  const base = getAppBaseUrl();
  return {
    configured: campayConfigured || cinetpayConfigured,
    activeProvider,
    providers: {
      campayConfigured,
      cinetpayConfigured,
    },
    supportedMethods,
    webhookUrls: {
      campay: `${base}/api/subscriptions/payments/webhook/campay`,
      cinetpay: `${base}/api/subscriptions/payments/webhook/cinetpay`,
    },
  };
}

async function resolveCamPayBearerToken(): Promise<string> {
  if (process.env.CAMPAY_TOKEN?.trim()) {
    return process.env.CAMPAY_TOKEN.trim();
  }
  const baseUrl = (process.env.CAMPAY_BASE_URL || 'https://www.campay.net/api').replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.CAMPAY_APP_USERNAME?.trim(),
      password: process.env.CAMPAY_APP_PASSWORD?.trim(),
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.token) {
    throw new Error(data?.detail || 'Authentification CamPay échouée.');
  }
  return data.token;
}

export async function initiateRealPayment(params: {
  txId: string;
  invoiceNumber: string;
  amountXAF: number;
  phoneNumber?: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerCity?: string;
  preferredProvider?: PaymentGatewayProvider;
}): Promise<{
  provider: PaymentGatewayProvider;
  externalReference: string;
  paymentUrl?: string;
  ussdCode?: string;
  operator?: string;
  status: PaymentTransactionStatus;
}> {
  const gw = getPaymentGatewayStatus();
  if (!gw.configured) {
    throw new Error(
      'Aucune passerelle de paiement réelle n’est encore configurée sur le serveur. ' +
        'Ajoutez vos identifiants marchands CamPay (CAMPAY_TOKEN) ou CinetPay (CINETPAY_API_KEY + CINETPAY_SITE_ID) dans les secrets d’environnement pour déclencher un vrai débit FCFA.'
    );
  }

  const chosen: PaymentGatewayProvider =
    params.preferredProvider &&
    params.preferredProvider !== 'NONE' &&
    ((params.preferredProvider === 'CAMPAY' && gw.providers.campayConfigured) ||
      (params.preferredProvider === 'CINETPAY' && gw.providers.cinetpayConfigured))
      ? params.preferredProvider
      : gw.activeProvider;

  if (chosen === 'CAMPAY') {
    const msisdn = normalizeCameroonPhone(params.phoneNumber || '');
    if (!msisdn) {
      throw new Error(
        'Numéro Mobile Money Cameroun invalide. Saisissez un numéro à 9 chiffres commençant par 6 (ex : 699451280).'
      );
    }

    const token = await resolveCamPayBearerToken();
    const baseUrl = (process.env.CAMPAY_BASE_URL || 'https://www.campay.net/api').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/collect/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(Math.round(params.amountXAF)),
        currency: 'XAF',
        from: msisdn,
        description: params.description.slice(0, 100),
        external_reference: params.txId,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.reference) {
      throw new Error(
        data?.message || data?.detail || 'CamPay a refusé l’initiation du paiement Mobile Money.'
      );
    }

    return {
      provider: 'CAMPAY',
      externalReference: String(data.reference),
      ussdCode: data.ussd_code ? String(data.ussd_code) : undefined,
      operator: data.operator ? String(data.operator) : undefined,
      status: 'PENDING_CONFIRMATION',
    };
  }

  if (chosen === 'CINETPAY') {
    const baseUrl = getAppBaseUrl();
    // CinetPay impose un montant multiple de 5 FCFA
    const amountMultiple5 = Math.max(100, Math.round(params.amountXAF / 5) * 5);

    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY?.trim(),
        site_id: process.env.CINETPAY_SITE_ID?.trim(),
        transaction_id: params.txId,
        amount: amountMultiple5,
        currency: 'XAF',
        description: `${params.invoiceNumber} — ${params.description}`.slice(0, 120),
        notify_url: `${baseUrl}/api/subscriptions/payments/webhook/cinetpay`,
        return_url: baseUrl,
        channels: 'ALL',
        lang: 'fr',
        customer_name: params.customerName,
        customer_surname: 'BATI-PILOT',
        customer_email: params.customerEmail,
        customer_phone_number: normalizeCameroonPhone(params.phoneNumber || '') || '+237699000000',
        customer_city: params.customerCity || 'Douala',
        customer_country: 'CM',
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data?.code !== '201' || !data?.data?.payment_url) {
      throw new Error(
        data?.description || data?.message || 'CinetPay n’a pas pu initialiser le paiement.'
      );
    }

    return {
      provider: 'CINETPAY',
      externalReference: String(data.data.payment_token || params.txId),
      paymentUrl: String(data.data.payment_url),
      status: 'PENDING_CONFIRMATION',
    };
  }

  throw new Error('Passerelle de paiement introuvable.');
}

export async function verifyRealPaymentStatus(params: {
  provider: PaymentGatewayProvider;
  txId: string;
  externalReference?: string;
}): Promise<{
  status: PaymentTransactionStatus;
  operatorReference?: string;
  message?: string;
}> {
  if (params.provider === 'CAMPAY') {
    const ref = params.externalReference;
    if (!ref) {
      return { status: 'FAILED', message: 'Référence CamPay manquante.' };
    }
    const token = await resolveCamPayBearerToken();
    const baseUrl = (process.env.CAMPAY_BASE_URL || 'https://www.campay.net/api').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/transaction/${encodeURIComponent(ref)}/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.detail || 'Erreur de vérification CamPay.');
    }

    if (data.status === 'SUCCESSFUL') {
      return {
        status: 'SUCCESSFUL',
        operatorReference: data.operator_reference || ref,
        message: 'Paiement Mobile Money confirmé par CamPay.',
      };
    }
    if (data.status === 'FAILED') {
      return {
        status: 'FAILED',
        message: data.reason || 'Transaction annulée ou solde insuffisant.',
      };
    }
    return {
      status: 'PENDING_CONFIRMATION',
      message: 'En attente de validation PIN sur le téléphone du payeur.',
    };
  }

  if (params.provider === 'CINETPAY') {
    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY?.trim(),
        site_id: process.env.CINETPAY_SITE_ID?.trim(),
        transaction_id: params.txId,
      }),
    });
    const data: any = await res.json().catch(() => ({}));

    if (data?.code === '00' && data?.data?.status === 'ACCEPTED') {
      return {
        status: 'SUCCESSFUL',
        operatorReference: data.data.operator_id || data.data.payment_method || params.txId,
        message: 'Paiement vérifié et accepté par CinetPay.',
      };
    }
    if (data?.data?.status === 'REFUSED' || data?.code === '627') {
      return {
        status: 'FAILED',
        message: data?.description || 'Paiement refusé ou expiré sur CinetPay.',
      };
    }
    return {
      status: 'PENDING_CONFIRMATION',
      message: 'Paiement en attente de finalisation sur le guichet CinetPay.',
    };
  }

  return { status: 'FAILED', message: 'Passerelle non configurée.' };
}
