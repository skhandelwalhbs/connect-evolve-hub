import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, FileUp, X, FilePdf, FileText, FileSpreadsheet, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileAttachment } from "@/types/tag";
import type { Database } from "@/integrations/supabase/types";

type Interaction = Database['public']['Tables']['contact_interactions']['Row'];

const interactionTypes = [
  "Meeting", 
  "Phone Call", 
  "Email", 
  "Video Call", 
  "Social Media", 
  "Text Message", 
  "Other"
];

const interactionSchema = z.object({
  type: z.string().min(1, "Type is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type InteractionFormValues = z.infer<typeof interactionSchema>;

interface EditInteractionDialogProps {
  interaction: Interaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (interaction: Interaction) => void;
}

// File type icons mapping
const fileTypeIcons = {
  pdf: FilePdf,
  spreadsheet: FileSpreadsheet,
  default: FileText
};

// Function to determine icon based on file type
const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return fileTypeIcons.pdf;
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return fileTypeIcons.spreadsheet;
  return fileTypeIcons.default;
};

export function EditInteractionDialog({
  interaction,
  open,
  onOpenChange,
  onSuccess,
}: EditInteractionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<FileAttachment[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Parse existing attachments when the dialog opens
  useEffect(() => {
    if (open && interaction.file_attachments) {
      try {
        const attachments = 
          typeof interaction.file_attachments === 'string' 
            ? JSON.parse(interaction.file_attachments) 
            : interaction.file_attachments || [];
            
        setExistingAttachments(Array.isArray(attachments) ? attachments : []);
      } catch (error) {
        console.error("Failed to parse file attachments:", error);
        setExistingAttachments([]);
      }
    }
  }, [open, interaction]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setFilesToDelete([]);
      setNewFiles([]);
      setUploadProgress({});
    }
  }, [open]);

  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: interaction.type,
      date: new Date(interaction.date).toISOString().split('T')[0],
      notes: interaction.notes || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setNewFiles(prevFiles => [...prevFiles, ...Array.from(selectedFiles)]);
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const markFileForDeletion = (fileId: string) => {
    setFilesToDelete(prev => [...prev, fileId]);
  };

  const unmarkFileForDeletion = (fileId: string) => {
    setFilesToDelete(prev => prev.filter(id => id !== fileId));
  };

  const handleDownload = async (file: FileAttachment) => {
    try {
      // If the URL is already a signed URL, use it directly
      if (file.url.includes('token=')) {
        window.open(file.url, '_blank');
        return;
      }
      
      // For paths, generate a new signed URL
      const filePath = file.url.split('interaction_attachments/')[1];
      if (!filePath) {
        toast({
          title: "Download Error",
          description: "Could not determine file path",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase.storage
        .from('interaction_attachments')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
        
      if (error) {
        toast({
          title: "Download Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      toast({
        title: "Download Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: InteractionFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to update interactions.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Process existing attachments (remove files marked for deletion)
      let updatedAttachments = existingAttachments.filter(
        file => !filesToDelete.includes(file.id)
      );
      
      // 2. Upload new files (if any)
      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const fileId = crypto.randomUUID();
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${interaction.contact_id}/${fileId}.${fileExt}`;
          
          // Create a new progress tracker for this file
          setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('interaction_attachments')
            .upload(filePath, file, {
              onUploadProgress: (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                setUploadProgress(prev => ({ ...prev, [fileId]: percent }));
              }
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
            updatedAttachments.push({
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
      
      // 3. Update the interaction record with file attachments
      const { data, error } = await supabase
        .from('contact_interactions')
        .update({
          type: values.type,
          date: new Date(values.date).toISOString(),
          notes: values.notes,
          file_attachments: updatedAttachments
        })
        .eq('id', interaction.id)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating interaction:", error);
        toast({
          title: "Error",
          description: "Failed to update interaction. Please try again.",
          variant: "destructive",
        });
      } else if (data) {
        // 4. Delete files from storage if needed
        for (const fileId of filesToDelete) {
          const fileToDelete = existingAttachments.find(f => f.id === fileId);
          if (fileToDelete) {
            const filePath = fileToDelete.url.split('interaction_attachments/')[1];
            if (filePath) {
              await supabase.storage
                .from('interaction_attachments')
                .remove([filePath]);
            }
          }
        }
        
        onSuccess(data);
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Interaction</DialogTitle>
          <DialogDescription>
            Update the details of this interaction.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interaction Type</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {interactionTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about this interaction..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File Management Section */}
            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <div className="flex items-center space-x-2">
                <label 
                  htmlFor="edit-file-upload" 
                  className="cursor-pointer border rounded-md px-3 py-2 flex items-center gap-2 hover:bg-muted"
                >
                  <FileUp className="h-4 w-4" />
                  <span>Upload Files</span>
                </label>
                <Input
                  id="edit-file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Existing Files List */}
              {existingAttachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Current Attachments</p>
                  {existingAttachments.map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    const isMarkedForDeletion = filesToDelete.includes(file.id);
                    
                    return (
                      <div 
                        key={file.id}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          isMarkedForDeletion ? 'bg-destructive/10' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round((file.size || 0) / 1024)} KB)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDownload(file)}
                            disabled={isSubmitting || isMarkedForDeletion}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                          {isMarkedForDeletion ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => unmarkFileForDeletion(file.id)}
                              disabled={isSubmitting}
                              className="text-xs h-7"
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => markFileForDeletion(file.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* New Files List */}
              {newFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">New Attachments</p>
                  {newFiles.map((file, i) => {
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
                            onClick={() => removeNewFile(i)}
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
            
            {/* Historical Tags Section (view only) */}
            {interaction.historical_tags && Array.isArray(interaction.historical_tags) && interaction.historical_tags.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Tags at time of interaction</FormLabel>
                <div className="flex flex-wrap gap-1">
                  {interaction.historical_tags.map((tag: any) => (
                    <div 
                      key={tag.id}
                      className="inline-flex items-center space-x-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
