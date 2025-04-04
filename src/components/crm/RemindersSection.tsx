
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Bell, PlusCircle, Edit, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AddReminderDialog } from "./AddReminderDialog";
import { EditReminderDialog } from "./EditReminderDialog";
import { RemindersTable } from "./RemindersTable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Reminder } from "./EditReminderDialog";
import { AddInteractionDialog } from "./AddInteractionDialog";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface RemindersSectionProps {
  contactId: string;
  contact?: Contact | null;
  view?: 'cards' | 'table';
}

export function RemindersSection({ contactId, contact, view = 'cards' }: RemindersSectionProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [completedReminders, setCompletedReminders] = useState<Reminder[]>([]);
  const [showAddReminderDialog, setShowAddReminderDialog] = useState(false);
  const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [showCompletedReminders, setShowCompletedReminders] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddInteractionDialog, setShowAddInteractionDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const [reminderToComplete, setReminderToComplete] = useState<Reminder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReminders();
  }, [contactId]);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_reminders' as any)
        .select('*')
        .eq('contact_id', contactId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error("Error fetching reminders:", error);
        toast({
          title: "Error",
          description: "Failed to load reminders. Please try again.",
          variant: "destructive",
        });
      } else {
        // First cast to unknown, then to Reminder[] to safely handle the type conversion
        const typedData = (data || []) as unknown as Reminder[];
        setReminders(typedData);
        
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

  const handleAddReminder = () => {
    setShowAddReminderDialog(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setReminderToEdit(reminder);
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    setReminderToDelete(reminder);
  };

  const confirmDeleteReminder = async () => {
    if (!reminderToDelete) return;
    
    try {
      const { error } = await supabase
        .from('contact_reminders' as any)
        .delete()
        .eq('id', reminderToDelete.id);
      
      if (error) {
        console.error("Error deleting reminder:", error);
        toast({
          title: "Error",
          description: "Failed to delete the reminder. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Reminder deleted successfully",
        });
        fetchReminders();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setReminderToDelete(null);
    }
  };

  const handleLogInteraction = (reminder: Reminder) => {
    if (!contact) return;
    setSelectedReminder(reminder);
    setShowAddInteractionDialog(true);
  };

  const handleInitiateComplete = (reminder: Reminder) => {
    setReminderToComplete(reminder);
    setShowCompleteConfirmation(true);
  };

  const handleCompleteReminder = async (shouldLogInteraction = false) => {
    if (!reminderToComplete) return;
    
    try {
      const { error } = await supabase
        .from('contact_reminders' as any)
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('id', reminderToComplete.id);
      
      if (error) {
        console.error("Error completing reminder:", error);
        toast({
          title: "Error",
          description: "Failed to complete the reminder. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Reminder marked as completed",
        });

        await fetchReminders();
        
        if (shouldLogInteraction && contact) {
          // If the user chose to log an interaction, open the dialog
          setSelectedReminder(reminderToComplete);
          setShowAddInteractionDialog(true);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setShowCompleteConfirmation(false);
      setReminderToComplete(null);
    }
  };

  const handleReminderAdded = () => {
    fetchReminders();
    setShowAddReminderDialog(false);
    toast({
      title: "Success",
      description: "Reminder added successfully",
    });
  };

  const handleReminderEdited = () => {
    fetchReminders();
    setReminderToEdit(null);
    toast({
      title: "Success",
      description: "Reminder updated successfully",
    });
  };

  const handleInteractionAdded = () => {
    setSelectedReminder(null);
    setShowAddInteractionDialog(false);
    toast({
      title: "Success",
      description: "Interaction logged successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const formatReminderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getBadgeVariant = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return 'default';
      case 'call':
        return 'secondary';
      case 'meeting':
        return 'outline';
      case 'linkedin':
        return { className: 'bg-blue-600 text-white hover:bg-blue-700' };
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Reminders</h3>
        <Button onClick={handleAddReminder}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      {view === 'table' ? (
        <RemindersTable 
          reminders={reminders} 
          contactId={contactId} 
          contact={contact || null}
        />
      ) : (
        // Card view (original)
        <div className="space-y-4">
          {/* Active Reminders */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Active</h4>
            {activeReminders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No active reminders
              </div>
            ) : (
              activeReminders.map((reminder) => (
                <div key={reminder.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{reminder.title}</div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {formatReminderDate(reminder.date)}
                      </div>
                    </div>
                    <Badge variant={getBadgeVariant(reminder.channel) as any}>
                      {reminder.channel}
                    </Badge>
                  </div>
                  
                  {reminder.notes && (
                    <p className="text-sm mt-2">{reminder.notes}</p>
                  )}
                  
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handleInitiateComplete(reminder)}>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Complete
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleLogInteraction(reminder)}>
                      <Bell className="h-3.5 w-3.5 mr-1.5" />
                      Log Interaction
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditReminder(reminder)}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteReminder(reminder)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <Collapsible open={showCompletedReminders} onOpenChange={setShowCompletedReminders}>
              <CollapsibleTrigger className="flex items-center text-sm font-medium text-muted-foreground">
                <div className="flex-1 flex items-center">
                  <h4>Completed Reminders</h4>
                  <Badge variant="secondary" className="ml-2">{completedReminders.length}</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {completedReminders.map((reminder) => (
                  <div key={reminder.id} className="border rounded-md p-4 bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{reminder.title}</div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {formatReminderDate(reminder.date)}
                        </div>
                      </div>
                      <Badge variant="outline">{reminder.channel}</Badge>
                    </div>
                    
                    {reminder.notes && (
                      <p className="text-sm mt-2">{reminder.notes}</p>
                    )}
                    
                    <div className="flex space-x-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleLogInteraction(reminder)}>
                        <Bell className="h-3.5 w-3.5 mr-1.5" />
                        Log Interaction
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteReminder(reminder)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Add Reminder Dialog */}
      {showAddReminderDialog && (
        <AddReminderDialog
          contactId={contactId}
          open={showAddReminderDialog}
          onOpenChange={setShowAddReminderDialog}
          onSuccess={handleReminderAdded}
        />
      )}

      {/* Edit Reminder Dialog */}
      {reminderToEdit && (
        <EditReminderDialog
          reminder={reminderToEdit}
          open={!!reminderToEdit}
          onOpenChange={(open) => !open && setReminderToEdit(null)}
          onSuccess={handleReminderEdited}
        />
      )}

      {/* Log Interaction Dialog */}
      {selectedReminder && contact && (
        <AddInteractionDialog
          contact={contact}
          open={showAddInteractionDialog}
          onOpenChange={setShowAddInteractionDialog}
          onSuccess={handleInteractionAdded}
          defaultValues={{
            type: selectedReminder.channel as any,
            notes: `Follow-up from reminder: ${selectedReminder.title}\n\n${selectedReminder.notes || ''}`,
            date: new Date().toISOString().split('T')[0]
          }}
        />
      )}

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={showCompleteConfirmation} onOpenChange={setShowCompleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to log an interaction for this completed reminder?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCompleteConfirmation(false);
              setReminderToComplete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleCompleteReminder(false)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Just Complete
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleCompleteReminder(true)}>
              Log Interaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!reminderToDelete} onOpenChange={(open) => !open && setReminderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this reminder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReminder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
