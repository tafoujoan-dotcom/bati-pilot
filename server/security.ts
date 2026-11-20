import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { Express, NextFunction, Request, Response } from 'express';
import type { UserRole } from '../src/types';

export interface AuthJwtPayload {
  userId: string;
  companyId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthJwtPayload;
    }
  }
}

const isProduction = process.env.NODE_ENV === 'production';

// Secret JWT : obligatoire en production via JWT_SECRET, sinon secret fort généré au démarrage
const RESOLVED_JWT_SECRET: string = (() => {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (isProduction) {
    console.warn(
      '[BATI-PILOT][SECURITE] JWT_SECRET absent ou trop court (<16 caractères). Génération d’un secret éphémère pour cette instance — configurez JWT_SECRET dans vos variables d’environnement !'
    );
  }
  return crypto.randomBytes(48).toString('hex');
})();

export const AUTH_COOKIE_NAME = 'bati_pilot_jwt';
const BCRYPT_ROUNDS = 10;

export function isBcryptHash(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  if (!plain || !storedHash) return false;
  if (isBcryptHash(storedHash)) {
    return bcrypt.compareSync(plain, storedHash);
  }
  // Compatibilité stricte durant migration si un ancien compte mémoire n'est pas encore haché
  return plain === storedHash;
}

export function signAuthToken(payload: {
  userId: string;
  companyId: string;
  role: UserRole;
}): string {
  return jwt.sign(payload, RESOLVED_JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'bati-pilot-saas',
  });
}

export function verifyAuthToken(token: string): AuthJwtPayload | null {
  try {
    const decoded = jwt.verify(token, RESOLVED_JWT_SECRET, {
      issuer: 'bati-pilot-saas',
    }) as AuthJwtPayload;
    if (!decoded?.userId || !decoded?.companyId || !decoded?.role) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(part.slice(0, idx).trim());
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[AUTH_COOKIE_NAME]) {
    return cookies[AUTH_COOKIE_NAME];
  }
  return null;
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    isProduction;

  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${7 * 24 * 60 * 60}`,
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    ...(isHttps ? ['Secure'] : []),
  ];

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

export function clearAuthCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    isProduction;

  const cookieParts = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    ...(isHttps ? ['Secure'] : []),
  ];

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

// Routes API publiques autorisées sans JWT
const PUBLIC_API_ROUTES: { method: string; path: string }[] = [
  { method: 'GET', path: '/system/health' },
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/register-company' },
  { method: 'POST', path: '/auth/logout' },
  { method: 'GET', path: '/auth/demo-accounts' },
  { method: 'POST', path: '/auth/demo-switch' },
  { method: 'POST', path: '/subscriptions/webhooks/campay' },
  { method: 'POST', path: '/subscriptions/webhooks/cinetpay' },
  { method: 'GET', path: '/download-documentation-pdf' },
  { method: 'GET', path: '/download-cahier-metier-pdf' },
  { method: 'GET', path: '/download-cahier-metier-docx' },
  { method: 'GET', path: '/download-zip' },
];

export function isPublicApiRoute(method: string, routePath: string): boolean {
  const normalizedMethod = method.toUpperCase() === 'HEAD' ? 'GET' : method.toUpperCase();
  const cleanPath = routePath.split('?')[0];
  return PUBLIC_API_ROUTES.some(
    (entry) => entry.method === normalizedMethod && entry.path === cleanPath
  );
}

/**
 * Middleware global d'authentification JWT + isolation multi-tenant stricte
 */
export function requireAuthMiddleware(
  getUserActiveStatus: (userId: string) => { exists: boolean; isActive: boolean; role: UserRole; companyId: string } | null
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    if (isPublicApiRoute(req.method, req.path)) {
      return next();
    }

    const token = extractAuthToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'Authentification requise. Veuillez vous connecter à votre espace BATI-PILOT.',
      });
    }

    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Session expirée ou jeton invalide. Veuillez vous reconnecter.',
      });
    }

    const liveUser = getUserActiveStatus(decoded.userId);
    if (!liveUser || !liveUser.exists) {
      return res.status(401).json({ error: 'Compte utilisateur introuvable ou supprimé.' });
    }
    if (!liveUser.isActive) {
      return res.status(403).json({ error: 'Ce compte utilisateur a été suspendu par l’administrateur.' });
    }

    // Vérité serveur issue du JWT + base de données
    const verifiedAuth: AuthJwtPayload = {
      userId: decoded.userId,
      companyId: liveUser.companyId,
      role: liveUser.role,
    };
    req.auth = verifiedAuth;

    // Verrouillage des en-têtes internes pour empêcher toute usurpation client
    req.headers['x-user-id'] = verifiedAuth.userId;
    req.headers['x-user-role'] = verifiedAuth.role;
    req.headers['x-company-id'] = verifiedAuth.companyId;

    // Isolation multi-tenant stricte pour les comptes entreprises (non SUPER_ADMIN)
    if (verifiedAuth.role !== 'SUPER_ADMIN') {
      const requestedQueryCompany = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
      if (requestedQueryCompany && requestedQueryCompany !== verifiedAuth.companyId) {
        return res.status(403).json({
          error: 'Accès refusé : violation d’isolation multi-tenant sur l’identifiant entreprise.',
        });
      }
      req.query.companyId = verifiedAuth.companyId;
      req.query.userRole = verifiedAuth.role;

      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        const requestedBodyCompany = typeof req.body.companyId === 'string' ? req.body.companyId : undefined;
        if (requestedBodyCompany && requestedBodyCompany !== verifiedAuth.companyId) {
          return res.status(403).json({
            error: 'Accès refusé : vous ne pouvez pas agir sur une autre entreprise.',
          });
        }
        req.body.companyId = verifiedAuth.companyId;
        req.body.userRole = verifiedAuth.role;
      }
    } else {
      req.query.userRole = 'SUPER_ADMIN';
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        req.body.userRole = 'SUPER_ADMIN';
      }
    }

    next();
  };
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de requêtes atteinte. Veuillez ralentir brièvement.',
  },
});

export function configureSecurityMiddleware(app: Express): void {
  // Requis derrière reverse proxy (Render, Cloud Run, Nginx) pour X-Forwarded-For & Secure cookies
  app.set('trust proxy', 1);

  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || process.env.APP_URL || '';
  const allowedOrigins = allowedOriginsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Appliquer Helmet et CORS uniquement sur /api afin de ne jamais perturber
  // le serveur Vite dev, le manifeste PWA ou l'iFrame d'aperçu AI Studio.
  app.use(
    '/api',
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
      originAgentCluster: false,
      hsts: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    '/api',
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!isProduction || allowedOrigins.length === 0) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origine CORS non autorisée : ${origin}`));
      },
      credentials: true,
    })
  );

  // En production uniquement, ajouter les en-têtes sûrs compatibles iFrame sur le frontend statique
  if (isProduction) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.path.startsWith('/api')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      }
      next();
    });
  }
}

// ============================================================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================================================

export const loginSchema = z.object({
  email: z.string().trim().email('Adresse email invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

export const registerCompanySchema = z.object({
  companyName: z.string().trim().min(2, 'Nom de l’entreprise requis (min. 2 caractères).').max(150),
  city: z.string().trim().max(100).optional().default('Douala'),
  phone: z.string().trim().max(50).optional().default('+237 600 00 00 00'),
  email: z.string().trim().email('Adresse email professionnelle invalide.'),
  firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
  lastName: z.string().trim().min(1, 'Nom requis.').max(80),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.').max(128),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional().default('PRO'),
});

export const createUserSchema = z.object({
  companyId: z.string().trim().min(1).optional(),
  firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
  lastName: z.string().trim().min(1, 'Nom requis.').max(80),
  email: z.string().trim().email('Email collaborateur invalide.'),
  phone: z.string().trim().max(50).optional(),
  role: z.enum(['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'WORKER', 'SUPER_ADMIN']),
  specialty: z.string().trim().max(150).optional(),
  password: z.string().trim().max(128).optional(),
});

export const changePasswordSchema = z.object({
  userId: z.string().trim().min(1),
  oldPassword: z.string().min(1, 'Ancien mot de passe requis.'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit comporter au moins 6 caractères.').max(128),
});

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message || 'Données invalides.';
}
