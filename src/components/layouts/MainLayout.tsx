
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, User, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  return (
    <SidebarProvider defaultOpen={true} onOpenChange={setIsSidebarOpen}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-4">
            <div className="flex items-center">
              <SidebarTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SidebarTrigger>
              <h1 className="text-xl font-semibold ml-2">Connect Hub</h1>
            </div>
            <div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/account">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AppSidebar = () => {
  const location = useLocation();
  
  return (
    <Sidebar>
      <SidebarContent className="py-2">
        <div className="px-3 py-2">
          <h2 className="text-lg font-semibold mb-4">Connect Hub</h2>
          <nav className="space-y-1">
            <Link 
              to="/dashboard" 
              className={`flex items-center px-3 py-2 text-sm rounded-md ${
                location.pathname === "/dashboard" ? "bg-secondary" : "hover:bg-secondary"
              }`}
            >
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/contacts" 
              className={`flex items-center px-3 py-2 text-sm rounded-md ${
                location.pathname === "/contacts" ? "bg-secondary" : "hover:bg-secondary"
              }`}
            >
              <span>Contacts</span>
            </Link>
            <Link 
              to="/crm" 
              className={`flex items-center px-3 py-2 text-sm rounded-md ${
                location.pathname === "/crm" ? "bg-secondary" : "hover:bg-secondary"
              }`}
            >
              <span>CRM</span>
            </Link>
            <div className="pt-4 pb-2">
              <Button className="w-full" asChild>
                <Link to="/contacts/add">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
