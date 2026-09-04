import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap } from "lucide-react";

export function ProtectedRoute({
  children,
  somenteCoordenador = false,
}: {
  children: ReactNode;
  somenteCoordenador?: boolean;
}) {
  const { session, profile, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <GraduationCap size={32} className="animate-pulse text-gold" />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (somenteCoordenador && profile.papel !== "coordenador") {
    return <Navigate to="/descritiva" replace />;
  }

  return <>{children}</>;
}
