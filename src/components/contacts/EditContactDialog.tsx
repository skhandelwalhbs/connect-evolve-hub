import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Clock } from "lucide-react";
import { AddReminderDialog } from "@/components/crm/AddReminderDialog";
import { TagSelector } from "@/components/tags/TagSelector";
import type { Database } from "@/integrations/supabase/types";
import { Tag as TagType } from "@/types/database-extensions";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditContactDialog({ contact, open, onOpenChange, onSuccess }: EditContactDialogProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const { toast } = useToast();

  // Initialize form data when contact changes or dialog opens
  useEffect(() => {
    if (contact && open) {
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position,
        location: contact.location,
        url: contact.url,
        notes: contact.notes,
      });

      // Load contact tags
      fetchContactTags(contact.id);
    } else {
      setFormData({});
      setSelectedTags([]);
    }
  }, [contact, open]);

  // Fetch tags for this contact
  const fetchContactTags = async (contactId: string) => {
    setIsLoadingTags(true);
    try {
      // First get the tag IDs related to this contact
      const { data: contactTagsData, error: contactTagsError } = await supabase
        .from('contact_tags')
        .select('tag_id')
        .eq('contact_id', contactId) as unknown as { data: { tag_id: string }[] | null; error: any };
      
      if (contactTagsError) {
        throw contactTagsError;
      }
      
      if (contactTagsData && contactTagsData.length > 0) {
        // Get the actual tag objects using the tag IDs
        const tagIds = contactTagsData.map(item => item.tag_id);
        
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds) as unknown as { data: TagType[] | null; error: any };
        
        if (tagsError) {
          throw tagsError;
        }
        
        setSelectedTags(tagsData || []);
      } else {
        setSelectedTags([]);
      }
    } catch (error) {
      console.error("Error fetching contact tags:", error);
      toast({
        title: "Error",
        description: "Failed to load contact tags.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tags change
  const handleTagsChange = (tags: TagType[]) => {
    setSelectedTags(tags);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contact) return;
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'company', 'position', 'location'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update contact information
      const { error } = await supabase
        .from('contacts')
        .update(formData)
        .eq('id', contact.id);
      
      if (error) {
        throw error;
      }

      // Update contact tags
      // First delete all existing tags for this contact
      await supabase.from('contact_tags').delete().eq('contact_id', contact.id) as unknown as any;
      
      // Then add the newly selected tags
      if (selectedTags.length > 0) {
        const tagAssignments = selectedTags.map(tag => ({
          contact_id: contact.id,
          tag_id: tag.id,
        }));
        
        // Cast to any to avoid TypeScript errors
        const { error: tagError } = await supabase
          .from('contact_tags')
          .insert(tagAssignments as any);
        
        if (tagError) {
          throw tagError;
        }
      }
      
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening reminder dialog
  const handleSetReminder = () => {
    if (contact) {
      setReminderDialogOpen(true);
    }
  };

  // Handle successful reminder creation
  const handleReminderSuccess = () => {
    toast({
      title: "Reminder set",
      description: "Reminder has been created successfully for this contact",
    });
  };

  if (!contact) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the contact information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">Profile URL</Label>
                <Input
                  id="url"
                  name="url"
                  value={formData.url || ""}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagSelector
                  contactId={contact.id}
                  selectedTags={selectedTags}
                  onTagsChange={handleTagsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex justify-between sm:justify-between mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSetReminder} 
              className="flex items-center gap-2"
              size="sm"
            >
              <Clock className="h-4 w-4" />
              Set Reminder
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Reminder Dialog */}
      {contact && (
        <AddReminderDialog
          contactId={contact.id}
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          onSuccess={handleReminderSuccess}
        />
      )}
    </>
  );
}
