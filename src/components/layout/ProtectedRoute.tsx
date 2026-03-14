import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não tem usuário, manda para o Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
