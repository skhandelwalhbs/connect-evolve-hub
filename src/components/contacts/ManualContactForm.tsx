
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function ManualContactForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    meetingPlace: "",
    meetingContext: "",
    date: new Date(),
    notes: "",
    connectionStrength: "medium",
  });

  const handleChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Split name into first and last name
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || ""; // Join the rest as last name
      
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
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.meetingPlace,
          job_title: formData.meetingContext,
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
      
      // Success
      toast({
        title: "Contact Added",
        description: `${formData.name} has been added to your contacts.`,
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        meetingPlace: "",
        meetingContext: "",
        date: new Date(),
        notes: "",
        connectionStrength: "medium",
      });
      
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
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
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="meetingContext">Where we met</Label>
          <Input
            id="meetingPlace"
            placeholder="Location, event, platform, etc."
            value={formData.meetingPlace}
            onChange={(e) => handleChange("meetingPlace", e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>When we met</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && handleChange("date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="connectionStrength">Connection Strength</Label>
            <Select
              value={formData.connectionStrength}
              onValueChange={(value) => handleChange("connectionStrength", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select strength" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strong">Strong</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="weak">Weak</SelectItem>
                <SelectItem value="new">Just Met</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="meetingContext">Meeting Context</Label>
          <Input
            id="meetingContext"
            placeholder="Conference, mutual friend, etc."
            value={formData.meetingContext}
            onChange={(e) => handleChange("meetingContext", e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Initial impressions, follow-up ideas, etc."
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
