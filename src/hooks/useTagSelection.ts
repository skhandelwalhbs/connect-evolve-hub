
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

export function useTagSelection(contactId: string, onTagsChange?: (tags: Tag[]) => void) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch all available tags
  useEffect(() => {
    async function fetchTags() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching tags:', error);
        toast({
          variant: "destructive",
          title: "Error fetching tags",
          description: error.message
        });
      } else {
        setTags(data || []);
      }
      setIsLoading(false);
    }
    
    fetchTags();
  }, [toast]);
  
  // Fetch existing tags for this contact
  useEffect(() => {
    async function fetchContactTags() {
      if (!contactId) return;
      
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*, tag:tags(*)')
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Error fetching contact tags:', error);
        toast({
          variant: "destructive",
          title: "Error fetching contact tags",
          description: error.message
        });
      } else if (data) {
        const contactTags = data.map(item => item.tag as Tag).filter(Boolean);
        setSelectedTags(contactTags);
        if (onTagsChange) {
          onTagsChange(contactTags);
        }
      }
    }
    
    fetchContactTags();
  }, [contactId, toast, onTagsChange]);
  
  const toggleTag = async (tag: Tag) => {
    try {
      const isSelected = selectedTags.some(t => t.id === tag.id);
      
      if (isSelected) {
        // Remove tag
        const { error } = await supabase
          .from('contact_tags')
          .delete()
          .eq('contact_id', contactId)
          .eq('tag_id', tag.id);
        
        if (error) throw error;
        
        const updatedTags = selectedTags.filter(t => t.id !== tag.id);
        setSelectedTags(updatedTags);
        if (onTagsChange) onTagsChange(updatedTags);
        
        toast({
          title: "Tag removed",
          description: `"${tag.name}" has been removed from this contact`
        });
      } else {
        // Add tag
        const { error } = await supabase
          .from('contact_tags')
          .insert({ contact_id: contactId, tag_id: tag.id });
        
        if (error) throw error;
        
        const updatedTags = [...selectedTags, tag];
        setSelectedTags(updatedTags);
        if (onTagsChange) onTagsChange(updatedTags);
        
        toast({
          title: "Tag added",
          description: `"${tag.name}" has been added to this contact`
        });
      }
    } catch (error: any) {
      console.error('Error toggling tag:', error);
      toast({
        variant: "destructive",
        title: "Error updating tags",
        description: error.message
      });
    }
  };
  
  return {
    tags,
    selectedTags,
    isLoading,
    toggleTag
  };
}
