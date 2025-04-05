
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Tag } from "./Tag";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  const { toast } = useToast();
  
  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);
  
  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      toast({
        variant: "destructive",
        title: "Error fetching tags",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setEditDialogOpen(true);
  };
  
  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedTag) return;
    
    try {
      setIsDeletingTag(true);
      
      // Check if tag is in use
      const { count, error: countError } = await supabase
        .from('contact_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', selectedTag.id);
      
      if (countError) throw countError;
      
      // Delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', selectedTag.id);
      
      if (error) throw error;
      
      // Update local state
      setTags(tags.filter(t => t.id !== selectedTag.id));
      
      // Show success message with count of affected contacts
      toast({
        title: "Tag deleted",
        description: count && count > 0
          ? `"${selectedTag.name}" has been removed from ${count} contact${count === 1 ? '' : 's'}.`
          : `"${selectedTag.name}" has been deleted.`
      });
      
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({
        variant: "destructive",
        title: "Error deleting tag",
        description: error.message
      });
    } finally {
      setIsDeletingTag(false);
    }
  };
  
  const handleTagCreated = (newTag: Tag) => {
    setTags(prevTags => 
      [...prevTags, newTag]
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  };
  
  const handleTagUpdated = (updatedTag: Tag) => {
    setTags(prevTags => 
      prevTags.map(tag => tag.id === updatedTag.id ? updatedTag : tag)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
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
          <div className="grid gap-2">
            {tags.map(tag => (
              <div 
                key={tag.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="h-4 w-4 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <Tag 
                    id={tag.id} 
                    name={tag.name} 
                    color={tag.color}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(tag)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(tag)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
