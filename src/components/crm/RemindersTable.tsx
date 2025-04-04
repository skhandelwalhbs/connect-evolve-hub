
import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MessageSquare, CalendarPlus, User } from "lucide-react";
import type { Reminder } from "./EditReminderDialog";
import { AddInteractionDialog } from "./AddInteractionDialog";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import type { Database } from "@/integrations/supabase/types";
import { generateGoogleCalendarUrl } from "@/lib/calendar-utils";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface RemindersTableProps {
  reminders: Reminder[];
  contactId: string;
  contact: Contact | null;
}

export function RemindersTable({ reminders, contactId, contact: initialContact }: RemindersTableProps) {
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showAddInteractionDialog, setShowAddInteractionDialog] = useState(false);
  const [showEditContactDialog, setShowEditContactDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleLogInteraction = (reminder: Reminder) => {
    if (!initialContact) return;
    setSelectedReminder(reminder);
    setShowAddInteractionDialog(true);
  };

  const handleInteractionAdded = () => {
    setShowAddInteractionDialog(false);
    setSelectedReminder(null);
  };
  
  const handleViewContact = (reminder: Reminder) => {
    if (reminder.contacts) {
      // Convert the reminder.contacts to the Contact type
      const contact: Contact = {
        id: reminder.contacts.id,
        first_name: reminder.contacts.first_name,
        last_name: reminder.contacts.last_name,
        company: reminder.contacts.company,
        position: reminder.contacts.position,
        email: reminder.contacts.email || null,
        phone: reminder.contacts.phone || null,
        location: reminder.contacts.location || "",
        url: null,
        notes: null,
        user_id: "",
        created_at: "",
        updated_at: "",
        connected_on: null
      };
      
      setSelectedContact(contact);
      setShowEditContactDialog(true);
    }
  };
  
  const handleAddToGoogleCalendar = (reminder: Reminder) => {
    const reminderDate = new Date(reminder.date);
    // Default end time is 1 hour after start time
    const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000);
    
    const calendarUrl = generateGoogleCalendarUrl({
      title: `${reminder.title} - ${reminder.channel} Reminder`,
      startDate: reminderDate,
      endDate: endDate,
      description: reminder.notes || `${reminder.channel} follow-up reminder`,
      location: reminder.contacts?.location || ""
    });
    
    // Open Google Calendar in new tab
    window.open(calendarUrl, "_blank");
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

  const sortedReminders = [...reminders].sort((a, b) => {
    // First sort by active status (active first)
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    
    // Then sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleContactUpdated = () => {
    // This will be called when the contact is updated
    // We could refresh data here if needed
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reminder Date</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Completed On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReminders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                  No reminders found
                </TableCell>
              </TableRow>
            ) : (
              sortedReminders.map((reminder) => (
                <TableRow key={reminder.id} className={!reminder.is_active ? "bg-muted/30" : ""}>
                  <TableCell>
                    <Badge variant={reminder.is_active ? "default" : "outline"}>
                      {reminder.is_active ? "Active" : "Completed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{reminder.title}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(reminder.channel) as any}>
                      {reminder.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reminder.contacts ? 
                      `${reminder.contacts.first_name} ${reminder.contacts.last_name}` : 
                      "-"}
                  </TableCell>
                  <TableCell>
                    {reminder.contacts?.company || "-"}
                  </TableCell>
                  <TableCell>
                    {reminder.contacts?.location || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDate(reminder.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDate(reminder.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {!reminder.is_active ? (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(reminder.updated_at)}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {reminder.contacts && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewContact(reminder)}
                        >
                          <User className="h-3.5 w-3.5 mr-1.5" />
                          View Contact
                        </Button>
                      )}
                      {reminder.is_active && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddToGoogleCalendar(reminder)}
                        >
                          <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                          Add to Calendar
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleLogInteraction(reminder)}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Log Interaction
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedReminder && initialContact && (
        <AddInteractionDialog
          contact={initialContact}
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

      {/* Add EditContactDialog */}
      {selectedContact && (
        <EditContactDialog
          contact={selectedContact}
          open={showEditContactDialog}
          onOpenChange={setShowEditContactDialog}
          onSuccess={handleContactUpdated}
        />
      )}
    </div>
  );
}
