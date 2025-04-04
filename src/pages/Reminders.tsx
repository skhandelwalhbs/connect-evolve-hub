
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Grid, List, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RemindersTable } from "@/components/crm/RemindersTable";
import type { Reminder } from "@/components/crm/EditReminderDialog";

export default function Reminders() {
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [completedReminders, setCompletedReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'table'>('table');
  const { toast } = useToast();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        toast({
          title: "Authentication error",
          description: "Please sign in to view your reminders",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Fetch reminders for the current user
      const { data, error } = await supabase
        .from('contact_reminders')
        .select(`
          *,
          contacts:contact_id (
            id,
            first_name,
            last_name,
            company,
            position,
            email,
            phone,
            location
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error("Error fetching reminders:", error);
        toast({
          title: "Error",
          description: "Failed to load reminders. Please try again.",
          variant: "destructive",
        });
      } else {
        // Cast to the right type
        const typedData = (data || []) as unknown as (Reminder & { contacts: any })[];
        
        // Split reminders into active and completed
        const active = typedData.filter(reminder => reminder.is_active);
        const completed = typedData.filter(reminder => !reminder.is_active);
        
        setActiveReminders(active);
        setCompletedReminders(completed);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <div className="flex space-x-1">
          <Button 
            variant={view === 'cards' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setView('cards')}
            className="h-8 w-8"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={view === 'table' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setView('table')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Active 
            <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {activeReminders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              {completedReminders.length}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Reminders</CardTitle>
              <CardDescription>Upcoming reminders that require your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : activeReminders.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No active reminders
                </div>
              ) : (
                <RemindersTable 
                  reminders={activeReminders} 
                  contactId="" 
                  contact={null} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Reminders</CardTitle>
              <CardDescription>Reminders you've already addressed</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : completedReminders.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No completed reminders
                </div>
              ) : (
                <RemindersTable 
                  reminders={completedReminders} 
                  contactId="" 
                  contact={null} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
