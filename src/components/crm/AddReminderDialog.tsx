import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { generateGoogleCalendarUrl } from "@/lib/calendar-utils";

interface AddReminderDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CHANNEL_OPTIONS = [
  "Email",
  "Call",
  "Meeting",
  "LinkedIn",
  "WhatsApp",
  "Twitter",
  "Other"
];

export function AddReminderDialog({ contactId, open, onOpenChange, onSuccess }: AddReminderDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");
  const [channel, setChannel] = useState("Email");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [showCalendarOption, setShowCalendarOption] = useState(false);
  const [newReminderId, setNewReminderId] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !time || !channel || !contactId) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Combine date and time
    const [hours, minutes] = time.split(":").map(Number);
    const reminderDate = new Date(date);
    reminderDate.setHours(hours, minutes);

    try {
      // Use the correct type casting approach for consistency
      const { data, error } = await supabase
        .from('contact_reminders' as any)
        .insert({
          contact_id: contactId,
          title,
          date: reminderDate.toISOString(),
          channel,
          notes,
          is_active: true,
          user_id: (await supabase.auth.getUser()).data.user?.id
        } as unknown as any)
        .select();
      
      if (error) {
        console.error("Error creating reminder:", error);
        toast({
          title: "Error",
          description: "Failed to create reminder. Please try again.",
          variant: "destructive",
        });
      } else {
        // Show the calendar option after successful creation
        setShowCalendarOption(true);
        if (data && data.length > 0) {
          setNewReminderId(data[0].id);
        }
        toast({
          title: "Reminder Created",
          description: "Your reminder has been successfully created.",
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToGoogleCalendar = () => {
    // Combine date and time for the calendar URL
    const [hours, minutes] = time.split(":").map(Number);
    const reminderDate = new Date(date!);
    reminderDate.setHours(hours, minutes);
    
    // Default end time is 1 hour after start time
    const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000);
    
    const calendarUrl = generateGoogleCalendarUrl({
      title: `${title} - ${channel} Reminder`,
      startDate: reminderDate,
      endDate: endDate,
      description: notes || `${channel} follow-up reminder`,
    });
    
    // Open Google Calendar in a new tab
    window.open(calendarUrl, "_blank");
  };

  const resetForm = () => {
    setTitle("");
    setDate(new Date());
    setTime("12:00");
    setChannel("Email");
    setNotes("");
    setShowCalendarOption(false);
    setNewReminderId(null);
  };

  const handleClose = () => {
    if (showCalendarOption) {
      // If we've shown the calendar option, we've already created the reminder
      onSuccess();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>
        
        {showCalendarOption ? (
          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                  <CalendarPlus className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">Reminder Created!</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Would you like to add this reminder to your Google Calendar?
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleAddToGoogleCalendar} className="w-full">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Add to Google Calendar
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full">
                  Skip
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Follow up on proposal"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="time" 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <select
                id="channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CHANNEL_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Additional details about the reminder..."
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Reminder"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
