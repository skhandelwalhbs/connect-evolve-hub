import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, Edit, FileText, Download, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditInteractionDialog } from "./EditInteractionDialog";
import { FileAttachment, HistoricalTag } from "@/types/tag";
import type { Database } from "@/integrations/supabase/types";

type Interaction = Database['public']['Tables']['contact_interactions']['Row'];

interface InteractionsListProps {
  contactId: string;
}

// File type icons
const getFileIcon = (fileType: string) => {
  // This is a simple implementation - we could expand this with more file types
  return FileText;
};

export function InteractionsList({ contactId }: InteractionsListProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInteractions();
  }, [contactId]);

  const fetchInteractions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching interactions:", error);
        toast({
          title: "Error",
          description: "Failed to load interaction history. Please try again.",
          variant: "destructive",
        });
      } else {
        setInteractions(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInteractionUpdated = (updatedInteraction: Interaction) => {
    setInteractions(prev => 
      prev.map(interaction => 
        interaction.id === updatedInteraction.id ? updatedInteraction : interaction
      )
    );
    toast({
      title: "Success",
      description: "Interaction updated successfully."
    });
  };

  const handleDownloadFile = async (file: FileAttachment) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No interactions recorded yet
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Interaction History</h3>
        <div className="space-y-4">
          {interactions.map((interaction) => {
            // Parse file attachments
            let attachments: FileAttachment[] = [];
            if (interaction.file_attachments) {
              try {
                attachments = typeof interaction.file_attachments === 'string'
                  ? JSON.parse(interaction.file_attachments)
                  : interaction.file_attachments || [];
              } catch (e) {
                console.error("Error parsing file attachments:", e);
              }
            }

            // Parse historical tags
            let historicalTags: HistoricalTag[] = [];
            if (interaction.historical_tags) {
              try {
                historicalTags = typeof interaction.historical_tags === 'string'
                  ? JSON.parse(interaction.historical_tags)
                  : interaction.historical_tags || [];
              } catch (e) {
                console.error("Error parsing historical tags:", e);
              }
            }

            return (
              <div key={interaction.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{interaction.type}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {formatDate(interaction.date)}
                  </div>
                </div>
                <p className="text-sm mb-3">{interaction.notes || "No notes"}</p>
                
                {/* Display file attachments */}
                {attachments.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map(file => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <Tooltip key={file.id}>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 py-1 text-xs flex items-center gap-1"
                                onClick={() => handleDownloadFile(file)}
                              >
                                <FileIcon className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[100px]">{file.name}</span>
                                <Download className="h-3 w-3 ml-1" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round((file.size || 0) / 1024)} KB
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Display historical tags */}
                {historicalTags.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Tags at time of interaction
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {historicalTags.map(tag => (
                        <div
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
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
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Added on {formatDateTime(interaction.created_at)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingInteraction(interaction)}
                    className="h-8"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {editingInteraction && (
          <EditInteractionDialog
            interaction={editingInteraction}
            open={Boolean(editingInteraction)}
            onOpenChange={() => setEditingInteraction(null)}
            onSuccess={handleInteractionUpdated}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
