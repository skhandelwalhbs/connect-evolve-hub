
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      navigate(user ? "/dashboard" : "/auth");
    }
  }, [user, isLoading, navigate]);

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // Redirect based on auth state
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
};

export default Index;
