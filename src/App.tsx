import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { TenantManagementView } from './components/tenants/TenantManagementView';
import { RolePermissionsView } from './components/roles/RolePermissionsView';
import { DashboardOverviewView } from './components/dashboard/DashboardOverviewView';
import { ProjectManagementView } from './components/projects/ProjectManagementView';
import { ProgressTrackingView } from './components/progress/ProgressTrackingView';
import { WorkforceAttendanceView } from './components/workforce/WorkforceAttendanceView';
import { PayrollManagementView } from './components/payroll/PayrollManagementView';
import { StockManagementView } from './components/stock/StockManagementView';
import { PurchaseOrdersView } from './components/orders/PurchaseOrdersView';
import { DeliveryNotesView } from './components/deliveries/DeliveryNotesView';
import { ExpensesBudgetView } from './components/expenses/ExpensesBudgetView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { OfflinePwaView } from './components/pwa/OfflinePwaView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ReportsDocumentsView } from './components/reports/ReportsDocumentsView';

export type AppStep =
  | 'step3'
  | 'step4'
  | 'step5'
  | 'step6'
  | 'step7'
  | 'step8'
  | 'step9'
  | 'step10'
  | 'step11'
  | 'step12'
  | 'step13'
  | 'step14'
  | 'step15'
  | 'step16'
  | 'step17'
  | 'step18';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Erreur d’affichage inattendue.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BATI-PILOT] Erreur de rendu React:', error, info);
  }

  handleResetSession = () => {
    try {
      localStorage.removeItem('bati_pilot_auth_session');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h1 className="text-lg font-extrabold text-white">BATI-PILOT — Récupération d’interface</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Une erreur locale a interrompu l’affichage ({this.state.errorMessage}).
            </p>
            <button
              type="button"
              onClick={this.handleResetSession}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
            >
              Recharger l’application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainAppContent() {
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<AppStep>('step5');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Chargement de BATI-PILOT...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppLayout currentStep={currentStep} setCurrentStep={setCurrentStep}>
      {currentStep === 'step18' && <SubscriptionsView />}
      {currentStep === 'step17' && <OfflinePwaView />}
      {currentStep === 'step16' && <NotificationsView onNavigateStep={setCurrentStep} />}
      {currentStep === 'step15' && <ReportsDocumentsView />}
      {currentStep === 'step14' && <SuppliersView />}
      {currentStep === 'step13' && <ExpensesBudgetView />}
      {currentStep === 'step12' && <DeliveryNotesView />}
      {currentStep === 'step11' && <PurchaseOrdersView />}
      {currentStep === 'step10' && <StockManagementView />}
      {currentStep === 'step9' && <PayrollManagementView />}
      {currentStep === 'step8' && <WorkforceAttendanceView />}
      {currentStep === 'step7' && <ProgressTrackingView />}
      {currentStep === 'step6' && <ProjectManagementView />}
      {currentStep === 'step5' && <DashboardOverviewView />}
      {currentStep === 'step4' && <RolePermissionsView />}
      {currentStep === 'step3' && <TenantManagementView />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </AppErrorBoundary>
  );
}
