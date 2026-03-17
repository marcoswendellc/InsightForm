import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";
import FormBuilderPage from "../pages/FormBuilder/FormBuilderPage";
import FormResponsePrintRoute from "../pages/FormBuilder/FormResponsePrintRoute";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { MainLayout } from "../layouts/MainLayout";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/formularios" element={<Navigate to="/builder" replace />} />
      <Route path="/formulario" element={<Navigate to="/builder" replace />} />
      <Route path="/forms" element={<Navigate to="/builder" replace />} />
      <Route path="/briefing" element={<Navigate to="/builder" replace />} />

      <Route
        path="/response-print"
        element={
          <ProtectedRoute>
            <FormResponsePrintRoute />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/builder" replace />} />
        <Route path="builder" element={<FormBuilderPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/builder" replace />} />
    </Routes>
  );
}