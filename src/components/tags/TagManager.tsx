
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { TagList } from "./TagList";
import { TagEditDialog } from "./TagEditDialog";
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
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTagManagement } from "@/hooks/useTagManagement";
import type { TagWithCount } from "@/types/tag";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

export function TagManager() {
  const { tags, isLoading, handleTagCreated, handleTagUpdated, handleDeleteTag } = useTagManagement();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagWithCount | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  const { toast } = useToast();
  
  const handleEdit = (tag: TagWithCount) => {
    setSelectedTag(tag);
    setEditDialogOpen(true);
  };
  
  const handleDelete = (tag: TagWithCount) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedTag) return;
    
    try {
      setIsDeletingTag(true);
      
      const success = await handleDeleteTag(selectedTag.id);
      
      if (success) {
        // Show success message with count of affected contacts
        toast({
          title: "Tag deleted",
          description: selectedTag.contact_count > 0
            ? `"${selectedTag.name}" has been removed from ${selectedTag.contact_count} contact${selectedTag.contact_count === 1 ? '' : 's'}.`
            : `"${selectedTag.name}" has been deleted.`
        });
      }
      
      setDeleteDialogOpen(false);
    } finally {
      setIsDeletingTag(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tag Management</CardTitle>
          <CardDescription>Create and manage tags for your contacts</CardDescription>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="mb-4">You haven't created any tags yet.</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Tag
            </Button>
          </div>
        ) : (
          <TagList 
            tags={tags} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </CardContent>
      
      {/* Create Tag Dialog */}
      <TagEditDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleTagCreated}
      />
      
      {/* Edit Tag Dialog */}
      {selectedTag && (
        <TagEditDialog
          tag={selectedTag}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleTagUpdated}
        />
      )}
      
      {/* Delete Tag Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the tag "{selectedTag?.name}" and remove it from all contacts.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTag}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeletingTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTag ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
