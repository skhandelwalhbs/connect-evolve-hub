
import { Link, useLocation } from "react-router-dom";
import { CalendarClock, UserPlus, Menu, User, Calendar, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="h-16 border-b flex items-center justify-between px-4 sticky top-0 bg-background z-10 shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-6 text-primary">Nubble</h1>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/dashboard">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), 
                      location.pathname === "/dashboard" ? "bg-secondary text-secondary-foreground" : ""
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/contacts">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), 
                      location.pathname === "/contacts" ? "bg-secondary text-secondary-foreground" : ""
                    )}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Contacts
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/crm">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), 
                      location.pathname === "/crm" ? "bg-secondary text-secondary-foreground" : ""
                    )}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    CRM
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/reminders">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), 
                      location.pathname === "/reminders" ? "bg-secondary text-secondary-foreground" : ""
                    )}
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Reminders
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
  );
};
