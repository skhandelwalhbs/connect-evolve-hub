
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  UsersIcon,
  CrownIcon,
  CalendarIcon,
  UserIcon,
  TagIcon
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
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
    <div className={cn("pb-12 border-r min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            ContactHub
          </h2>
          <div className="space-y-1">
            {user ? (
              <UserMenu />
            ) : (
              <Button asChild>
                <NavLink to="/auth">Sign In</NavLink>
              </Button>
            )}
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
