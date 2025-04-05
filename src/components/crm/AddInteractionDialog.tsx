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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileUp, X, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTagSelection } from "@/hooks/useTagSelection";
import { FileAttachment, HistoricalTag } from "@/types/tag";
import type { Database } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface AddInteractionDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    type: "Call" | "Meeting" | "Email" | "Follow-up" | "Other";
    notes?: string;
    date?: string;
  };
}

type InteractionType = "Call" | "Meeting" | "Email" | "Follow-up" | "Other";

// File type icons mapping
const fileTypeIcons = {
  default: FileText
};

// Function to determine icon based on file type
const getFileIcon = (fileType: string) => {
  return fileTypeIcons.default;
};

export function AddInteractionDialog({ 
  contact, 
  open, 
  onOpenChange, 
  onSuccess,
  defaultValues
}: AddInteractionDialogProps) {
  const [type, setType] = useState<InteractionType>("Call");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get tags for the contact to capture historical state
  const { selectedTags } = useTagSelection(contact.id);

  // Set default values when dialog opens or default values change
  useEffect(() => {
    if (open && defaultValues) {
      setType(defaultValues.type);
      setNotes(defaultValues.notes || "");
      if (defaultValues.date) {
        setDate(defaultValues.date);
      }
    }
  }, [open, defaultValues]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset to initial values
      if (!defaultValues) {
        setType("Call");
        setNotes("");
        setDate(new Date().toISOString().split('T')[0]);
        setFiles([]);
        setUploadProgress({});
      }
    }
  }, [open]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(selectedFiles)]);
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add interactions.",
        variant: "destructive",
      });
      return;
    }
    
    if (!type || !date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Store historical tag data
      const historicalTags: HistoricalTag[] = selectedTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }));
      
      // 2. Upload files (if any) and get their metadata
      const fileAttachments: FileAttachment[] = [];
      
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileId = crypto.randomUUID();
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${contact.id}/${fileId}.${fileExt}`;
          
          // Create a new progress tracker for this file
          setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('interaction_attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            toast({
              title: `Failed to upload ${file.name}`,
              description: uploadError.message,
              variant: "destructive",
            });
            continue;
          }
          
          // Get URL for the uploaded file
          const { data: urlData } = await supabase.storage
            .from('interaction_attachments')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
            
          if (urlData) {
            fileAttachments.push({
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              url: urlData.signedUrl,
              uploaded_at: new Date().toISOString()
            });
          }
        }
      }
      
      // 3. Create the interaction record with file attachments and historical tags
      const { error } = await supabase
        .from('contact_interactions')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          type,
          notes,
          date: new Date(date).toISOString(),
          file_attachments: fileAttachments as unknown as Json,
          historical_tags: historicalTags as unknown as Json
        });
      
      if (error) {
        console.error("Error adding interaction:", error);
        toast({
          title: "Failed to save",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
        onOpenChange(false);
        if (!defaultValues) {
          setType("Call");
          setNotes("");
          setDate(new Date().toISOString().split('T')[0]);
          setFiles([]);
          setUploadProgress({});
        }
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Interaction</DialogTitle>
          <DialogDescription>
            Record a new interaction with {contact.first_name} {contact.last_name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="type">Interaction Type *</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as InteractionType)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Email">Email</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details about the interaction, next steps, etc."
              rows={5}
            />
          </div>
          
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Attachments</Label>
            <div className="flex items-center space-x-2">
              <Label 
                htmlFor="file-upload" 
                className="cursor-pointer border rounded-md px-3 py-2 flex items-center gap-2 hover:bg-muted"
              >
                <FileUp className="h-4 w-4" />
                <span>Upload Files</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>
            
            {/* File List */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, i) => {
                  const FileIcon = getFileIcon(file.type);
                  const fileId = i.toString();
                  const progress = uploadProgress[fileId] || 0;
                  
                  return (
                    <div 
                      key={i}
                      className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      {isSubmitting && progress > 0 && progress < 100 ? (
                        <span className="text-xs">{progress}%</span>
                      ) : (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => removeFile(i)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Interaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
