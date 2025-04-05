
import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagEditDialogProps {
  tag?: Tag;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tag: Tag) => void;
}

// Predefined colors for tag selection
const PREDEFINED_COLORS = [
  "#9b87f5", // Purple (default)
  "#f87171", // Red
  "#fb923c", // Orange
  "#fbbf24", // Amber
  "#a3e635", // Lime
  "#34d399", // Emerald
  "#22d3ee", // Cyan
  "#60a5fa", // Blue
  "#c084fc", // Purple
  "#e879f9", // Fuchsia
  "#fb7185", // Rose
  "#94a3b8", // Slate
];

export function TagEditDialog({ tag, open, onOpenChange, onSuccess }: TagEditDialogProps) {
  const [name, setName] = useState(tag?.name || "");
  const [color, setColor] = useState(tag?.color || PREDEFINED_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Tag name is required"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (tag) {
        // Update existing tag
        const { data, error } = await supabase
          .from('tags')
          .update({ name, color })
          .eq('id', tag.id)
          .select()
          .single();
        
        if (error) throw error;
        
        toast({
          title: "Tag updated",
          description: `"${name}" has been updated successfully`
        });
        
        if (onSuccess && data) onSuccess(data);
      } else {
        // Create new tag
        const { data, error } = await supabase
          .from('tags')
          .insert({ name, color })
          .select()
          .single();
        
        if (error) throw error;
        
        toast({
          title: "Tag created",
          description: `"${name}" has been created successfully`
        });
        
        if (onSuccess && data) onSuccess(data);
      }
      
      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast({
        variant: "destructive",
        title: "Error saving tag",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form if closing
      setName(tag?.name || "");
      setColor(tag?.color || PREDEFINED_COLORS[0]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{tag ? "Edit Tag" : "Create New Tag"}</DialogTitle>
            <DialogDescription>
              {tag 
                ? "Update this tag's details below."
                : "Create a new tag to organize your contacts."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tag name"
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_COLORS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    className={`h-6 w-6 rounded-full cursor-pointer transition-all ${
                      color === colorOption
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => setColor(colorOption)}
                    aria-label={`Select color ${colorOption}`}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tag ? "Updating..." : "Creating..."}
                </>
              ) : tag ? (
                "Update Tag"
              ) : (
                "Create Tag"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
