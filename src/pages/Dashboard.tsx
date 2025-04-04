
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Users, Calendar, Mail, Phone, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

export default function Dashboard() {
  const [contactCount, setContactCount] = useState(0);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [activeReminderCount, setActiveReminderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchContactData() {
      try {
        // Fetch contact count
        const { count, error: countError } = await supabase
          .from('contacts')
          .select("*", { count: "exact", head: true });
        
        if (countError) {
          console.error("Error fetching contact count:", countError);
          toast({
            title: "Error",
            description: "Failed to load contact data. Please try again.",
            variant: "destructive",
          });
        } else {
          setContactCount(count || 0);
          
          // If we have contacts, fetch the recent ones
          if (count && count > 0) {
            const { data: recentData, error: recentError } = await supabase
              .from('contacts')
              .select("*")
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (recentError) {
              console.error("Error fetching recent contacts:", recentError);
            } else {
              setRecentContacts(recentData || []);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingRecent(false);
      }
    }

    async function fetchReminderData() {
      try {
        // Fetch active reminder count
        const { count, error: reminderError } = await supabase
          .from('contact_reminders')
          .select("*", { count: "exact", head: true })
          .eq('is_active', true);
        
        if (reminderError) {
          console.error("Error fetching reminder count:", reminderError);
        } else {
          setActiveReminderCount(count || 0);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoadingReminders(false);
      }
    }

    fetchContactData();
    fetchReminderData();
  }, [toast]);

  const handleContactCardClick = () => {
    navigate("/contacts");
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/contacts/add">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card 
          onClick={handleContactCardClick} 
          className="hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : contactCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {contactCount === 0 && !isLoading ? "Start adding your network" : "Contacts in your network"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-accent/50 transition-colors">
          <Link to="/reminders" className="block">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingReminders ? "..." : activeReminderCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeReminderCount === 0 && !isLoadingReminders 
                  ? "No pending reminders" 
                  : `${activeReminderCount} reminder${activeReminderCount !== 1 ? 's' : ''} requiring attention`}
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>Your most recently added contacts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : recentContacts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No contacts added yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                      <p className="text-sm text-muted-foreground">{contact.company || "No company"}</p>
                      <div className="flex flex-col space-y-1 mt-1">
                        {contact.email && (
                          <div className="flex items-center text-xs">
                            <Mail className="h-3 w-3 mr-1.5 text-muted-foreground" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-xs">
                            <Phone className="h-3 w-3 mr-1.5 text-muted-foreground" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link to="/contacts" className="text-sm text-primary hover:underline">
                    View all contacts
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
