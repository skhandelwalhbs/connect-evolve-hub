
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { TagWithCount } from "@/types/tag";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

export function useTagManagement() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch tags on hook initialization
  useEffect(() => {
    fetchTags();
  }, []);
  
  const fetchTags = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (tagsError) throw tagsError;
      
      // For each tag, fetch the count of associated contacts
      const tagsWithCounts = await Promise.all((tagsData || []).map(async (tag) => {
        const { count, error: countError } = await supabase
          .from('contact_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);
        
        if (countError) {
          console.error('Error fetching count for tag:', countError);
          return { ...tag, contact_count: 0 };
        }
        
        return { ...tag, contact_count: count || 0 };
      }));
      
      // Sort by name
      tagsWithCounts.sort((a, b) => a.name.localeCompare(b.name));
      
      setTags(tagsWithCounts);
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
  
  const handleDeleteTag = async (tagId: string) => {
    try {
      // Delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
      
      // Update local state
      setTags(prevTags => prevTags.filter(t => t.id !== tagId));
      
      return true;
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({
        variant: "destructive",
        title: "Error deleting tag",
        description: error.message
      });
      return false;
    }
  };
  
  const handleTagCreated = (newTag: Tag) => {
    // Add the new tag with a count of 0
    setTags(prevTags => 
      [...prevTags, { ...newTag, contact_count: 0 }]
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  };
  
  const handleTagUpdated = (updatedTag: Tag) => {
    // Preserve the existing contact count when updating
    setTags(prevTags => 
      prevTags.map(tag => {
        if (tag.id === updatedTag.id) {
          return { ...updatedTag, contact_count: tag.contact_count };
        }
        return tag;
      }).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  return {
    tags,
    isLoading,
    fetchTags,
    handleDeleteTag,
    handleTagCreated,
    handleTagUpdated
  };
}
