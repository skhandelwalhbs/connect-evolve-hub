
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TagSelector } from "@/components/tags/TagSelector";
import type { Database } from "@/integrations/supabase/types";
import { Tag as TagType } from "@/types/database-extensions";

export function ManualContactForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    location: "",
    url: "",
    connectedOn: new Date(),
    notes: "",
  });

  const handleChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add contacts.",
          variant: "destructive",
        });
        return;
      }
      
      // Save contact to Supabase
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          position: formData.position,
          location: formData.location,
          url: formData.url,
          connected_on: formData.connectedOn.toISOString().split('T')[0], // Format as YYYY-MM-DD
          notes: formData.notes
        })
        .select();
      
      if (error) {
        console.error("Error adding contact:", error);
        toast({
          title: "Error",
          description: "Failed to add contact. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If we have selected tags, associate them with the contact
      if (data && data.length > 0 && selectedTags.length > 0) {
        const contactId = data[0].id;
        
        const tagAssignments = selectedTags.map(tag => ({
          contact_id: contactId,
          tag_id: tag.id,
        }));
        
        const { error: tagError } = await supabase
          .from('contact_tags')
          .insert(tagAssignments);
        
        if (tagError) {
          console.error("Error adding tags to contact:", tagError);
          // We won't block the UI for tag errors, just log them
        }
      }
      
      // Success
      toast({
        title: "Contact Added",
        description: `${formData.firstName} ${formData.lastName} has been added to your contacts.`,
      });
      
      // Reset form or navigate
      navigate("/contacts");
      
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag changes
  const handleTagsChange = (tags: TagType[]) => {
    setSelectedTags(tags);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name*</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name*</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email" 
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="company">Company*</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">Position*</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange("position", e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location">Location*</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Connected On*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="connectedOn"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.connectedOn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.connectedOn ? format(formData.connectedOn, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.connectedOn}
                  onSelect={(date) => date && handleChange("connectedOn", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            value={formData.url}
            onChange={(e) => handleChange("url", e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags</Label>
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional information about this contact"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/contacts")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Contact"}
          </Button>
        </div>
      </div>
    </form>
  );
}
