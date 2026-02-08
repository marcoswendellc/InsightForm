import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";
import FormsPage from "../pages/Forms/FormsPage";
import BriefingPage from "../pages/Briefing/BriefingPage";
import FormBuilderPage from "../pages/FormBuilder/FormBuilderPage";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { MainLayout } from "../layouts/MainLayout";

export function AppRoutes() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<LoginPage />} />

      {/* Alias PT-BR */}
      <Route path="/formularios" element={<Navigate to="/forms" replace />} />
      <Route path="/formulario" element={<Navigate to="/builder" replace />} />

      {/* Privado */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Ao entrar logado, cai no briefing */}
        <Route index element={<Navigate to="/briefing" replace />} />

        <Route path="briefing" element={<BriefingPage />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="builder" element={<FormBuilderPage />} />
      </Route>

      {/* Qualquer coisa desconhecida */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
