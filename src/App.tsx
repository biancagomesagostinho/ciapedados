import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Descritiva from "@/pages/Descritiva";
import Preditiva from "@/pages/Preditiva";
import Prescritiva from "@/pages/Prescritiva";
import EnviarPlanilha from "@/pages/EnviarPlanilha";
import Aprovacoes from "@/pages/Aprovacoes";
import GestaoUsuarios from "@/pages/GestaoUsuarios";
import CatalogoAcoes from "@/pages/CatalogoAcoes";

function RotaLogin() {
  const { session, profile, carregando } = useAuth();
  if (!carregando && session && profile) {
    return <Navigate to="/descritiva" replace />;
  }
  return <Login />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RotaLogin />} />
      <Route
        path="/descritiva"
        element={
          <ProtectedRoute>
            <Layout>
              <Descritiva />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/preditiva"
        element={
          <ProtectedRoute>
            <Layout>
              <Preditiva />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescritiva"
        element={
          <ProtectedRoute>
            <Layout>
              <Prescritiva />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/enviar"
        element={
          <ProtectedRoute>
            <Layout>
              <EnviarPlanilha />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprovacoes"
        element={
          <ProtectedRoute somenteCoordenador>
            <Layout>
              <Aprovacoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute somenteCoordenador>
            <Layout>
              <GestaoUsuarios />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalogo"
        element={
          <ProtectedRoute somenteCoordenador>
            <Layout>
              <CatalogoAcoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/descritiva" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
