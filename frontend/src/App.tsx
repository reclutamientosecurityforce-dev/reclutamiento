import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/auth/LoginPage';
import { RecruitmentDashboardPage } from './pages/recruitment/RecruitmentDashboardPage';
import { CandidatesPage } from './pages/recruitment/CandidatesPage';
import { JobOpeningsPage } from './pages/recruitment/JobOpeningsPage';
import { SelectionPipelinePage } from './pages/recruitment/SelectionPipelinePage';
import { InterviewsPage } from './pages/recruitment/InterviewsPage';
import { RecruitmentReportsPage } from './pages/recruitment/RecruitmentReportsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { CompanySettingsPage } from './pages/admin/CompanySettingsPage';
import { AdminPortalCMSPage } from './pages/admin/AdminPortalCMSPage';

// Centro de Captación
import { CaptacionDashboardPage } from './pages/captacion/CaptacionDashboardPage';
import { CategoriesPage } from './pages/captacion/CategoriesPage';
import { CampaignsPage } from './pages/captacion/CampaignsPage';
import { ChannelsPage } from './pages/captacion/ChannelsPage';
import { PublicationsPage } from './pages/captacion/PublicationsPage';

// Portal Público
import { PublicJobsPage } from './pages/public/PublicJobsPage';
import { JobDetailPage } from './pages/public/JobDetailPage';
import { PublicationPage } from './pages/public/PublicationPage';
import { ApplicationWizardPage } from './pages/public/ApplicationWizardPage';
import { TrackApplicationPage } from './pages/public/TrackApplicationPage';
import { AboutPage } from './pages/public/AboutPage';
import { BenefitsPage } from './pages/public/BenefitsPage';
import { ContactPage } from './pages/public/ContactPage';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Verificando credenciales...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/recruitment/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

const RootRedirect: React.FC = () => {
  const { user, token, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) return <Navigate to="/postular" replace />;
  return <Navigate to="/recruitment/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Applicant Portal */}
          <Route path="/postular" element={<PublicJobsPage />} />
          <Route path="/postular/p/:slug" element={<PublicationPage />} />
          <Route path="/postular/:openingId" element={<JobDetailPage />} />
          <Route path="/postular/:openingId/flujo" element={<ApplicationWizardPage />} />
          <Route path="/postular/consultar" element={<TrackApplicationPage />} />
          <Route path="/postular/nosotros" element={<AboutPage />} />
          <Route path="/postular/beneficios" element={<BenefitsPage />} />
          <Route path="/postular/contacto" element={<ContactPage />} />

          {/* Internal Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* CENTRO DE CAPTACIÓN (Protected) */}
          <Route
            path="/recruitment/captacion"
            element={
              <ProtectedRoute>
                <CaptacionDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/captacion/categorias"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/captacion/campanias"
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/captacion/canales"
            element={
              <ProtectedRoute>
                <ChannelsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/captacion/publicaciones"
            element={
              <ProtectedRoute>
                <PublicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Recruitment Module Routes (Protected Backoffice) */}
          <Route
            path="/recruitment/dashboard"
            element={
              <ProtectedRoute>
                <RecruitmentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/candidates"
            element={
              <ProtectedRoute>
                <CandidatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/openings"
            element={
              <ProtectedRoute>
                <JobOpeningsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/pipeline"
            element={
              <ProtectedRoute>
                <SelectionPipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/interviews"
            element={
              <ProtectedRoute>
                <InterviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/reports"
            element={
              <ProtectedRoute>
                <RecruitmentReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Team / Admin */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/company-settings"
            element={
              <ProtectedRoute adminOnly>
                <CompanySettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/portal"
            element={
              <ProtectedRoute adminOnly>
                <AdminPortalCMSPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/postular" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
