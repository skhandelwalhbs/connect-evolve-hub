
import { Link, useLocation } from "react-router-dom";
import { CalendarClock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      <Sidebar className="hidden md:block" />
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-4 sticky top-0 bg-background z-10 shadow-sm">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold mr-6 text-primary">ContactHub</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/contacts/add">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Contact</span>
              </Link>
            </Button>
            {user && (
              <span className="text-sm font-medium hidden sm:block">
                Hello, {user.email?.split('@')[0] || 'User'}
              </span>
            )}
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
