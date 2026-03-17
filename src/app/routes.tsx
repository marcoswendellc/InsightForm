import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";
import FormBuilderPage from "../pages/FormBuilder/FormBuilderPage";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { MainLayout } from "../layouts/MainLayout";

export function AppRoutes() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<LoginPage />} />

      {/* Aliases */}
      <Route path="/formularios" element={<Navigate to="/builder" replace />} />
      <Route path="/formulario" element={<Navigate to="/builder" replace />} />
      <Route path="/forms" element={<Navigate to="/builder" replace />} />
      <Route path="/briefing" element={<Navigate to="/builder" replace />} />

      {/* Privado */}
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

      {/* Qualquer rota desconhecida vai para /builder */}
      <Route path="*" element={<Navigate to="/builder" replace />} />
    </Routes>
  );
}