
import { useState, useEffect } from "react";
import { Tag } from "./Tag";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database['public']['Tables']['tags']['Row'];

interface TagsListProps {
  contactId: string;
  onRemoveTag?: (tagId: string) => void;
  removable?: boolean;
  className?: string;
}

export function TagsList({ contactId, onRemoveTag, removable = false, className = "" }: TagsListProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchTags() {
      if (!contactId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('contact_tags')
          .select('tag:tags(*)')
          .eq('contact_id', contactId);
          
        if (error) throw error;
        
        // Extract tags from the joined data
        const contactTags = data
          ?.map(item => item.tag as Tag)
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name)) || [];
        
        setTags(contactTags);
      } catch (error: any) {
        console.error("Error fetching tags:", error);
        toast({
          variant: "destructive",
          title: "Error fetching tags",
          description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTags();
  }, [contactId, toast]);
  
  const handleRemoveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
      
      // Update local state
      setTags(tags.filter(tag => tag.id !== tagId));
      
      // Callback for parent component
      if (onRemoveTag) {
        onRemoveTag(tagId);
      }
    } catch (error: any) {
      console.error("Error removing tag:", error);
      toast({
        variant: "destructive",
        title: "Error removing tag",
        description: error.message
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    );
  }
  
  if (tags.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map(tag => (
        <Tag
          key={tag.id}
          id={tag.id}
          name={tag.name}
          color={tag.color}
          removable={removable}
          onRemove={removable ? () => handleRemoveTag(tag.id) : undefined}
        />
      ))}
    </div>
  );
}
