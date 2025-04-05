
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { NavMenubar } from "@/components/navigation/NavMenubar";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col w-full">
      <NavMenubar />
      
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};
