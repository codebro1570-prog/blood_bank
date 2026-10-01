import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ToastProvider } from './components/ToastContext';
import { AppLayout } from './components/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { DonorsPage } from './pages/DonorsPage';
import { DonorDetailPage } from './pages/DonorDetailPage';
import { EligibleDonorsPage } from './pages/EligibleDonorsPage';
import { DonationsPage } from './pages/DonationsPage';
import { NewDonationPage } from './pages/NewDonationPage';
import { DonationDetailPage } from './pages/DonationDetailPage';
import { InventoryPage } from './pages/InventoryPage';
import { RequestsPage } from './pages/RequestsPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { IssuesPage } from './pages/IssuesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public authentication route */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Protected Portal Routes for STAFF and ADMIN */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              {/* Donors routes */}
              <Route path="donors" element={<DonorsPage />} />
              <Route path="donors/eligible" element={<EligibleDonorsPage />} />
              <Route path="donors/:id" element={<DonorDetailPage />} />

              {/* Donations routes */}
              <Route path="donations" element={<DonationsPage />} />
              <Route path="donations/new" element={<NewDonationPage />} />
              <Route path="donations/:id" element={<DonationDetailPage />} />

              {/* Inventory & Requests */}
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="requests/:id" element={<RequestDetailPage />} />
              <Route path="issues" element={<IssuesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />

              {/* ADMIN-only routes */}
              <Route
                path="hospitals"
                element={
                  <ProtectedRoute adminOnly>
                    <HospitalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute adminOnly>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <ProtectedRoute adminOnly>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute adminOnly>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
