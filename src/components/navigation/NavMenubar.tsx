
import { Link } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  CrownIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";

export const NavMenubar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <HomeIcon className="h-4 w-4" />,
    },
    {
      label: "Contacts",
      href: "/contacts",
      icon: <UsersIcon className="h-4 w-4" />,
    },
    {
      label: "CRM",
      href: "/crm",
      icon: <CrownIcon className="h-4 w-4" />,
    },
    {
      label: "Reminders",
      href: "/reminders",
      icon: <CalendarIcon className="h-4 w-4" />,
    },
    {
      label: "Tags",
      href: "/tags",
      icon: <TagIcon className="h-4 w-4" />,
    },
    {
      label: "Account",
      href: "/account",
      icon: <UserIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="border-b shadow-sm bg-background">
      <div className="flex items-center justify-between px-4 py-2 container">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-6 text-primary">ContactHub</h1>
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink 
                    asChild 
                    active={location.pathname === item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === item.href ? "bg-accent text-accent-foreground" : ""
                    )}
                  >
                    <Link to={item.href} className="flex items-center gap-1">
                      {item.icon}
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/contacts/add">
              <span className="hidden sm:inline">Add Contact</span>
            </Link>
          </Button>
          {user && (
            <span className="text-sm font-medium hidden md:block">
              Hello, {user.email?.split('@')[0] || 'User'}
            </span>
          )}
          <UserMenu />
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden overflow-x-auto pb-1 pt-1 px-4">
        <div className="flex space-x-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              to={item.href}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                location.pathname === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
