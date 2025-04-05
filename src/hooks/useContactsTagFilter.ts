
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

export function useContactsTagFilter(contacts: Contact[], selectedTagIds: string[]) {
  const [contactsWithTags, setContactsWithTags] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Apply tag filtering
  useEffect(() => {
    // If no tags selected, return all contacts
    if (selectedTagIds.length === 0) {
      setContactsWithTags(contacts);
      return;
    }

    async function fetchContactsByTags() {
      setIsLoading(true);
      try {
        // Get all contact_ids that have ANY of the selected tags
        const { data: contactTagsData, error } = await supabase
          .from('contact_tags')
          .select('contact_id')
          .in('tag_id', selectedTagIds);

        if (error) {
          console.error('Error fetching contact tags:', error);
          return;
        }

        // Extract unique contact IDs
        const contactIds = [...new Set(contactTagsData.map(item => item.contact_id))];
        
        // Filter the contacts by the IDs we found
        const filteredContacts = contacts.filter(contact => 
          contactIds.includes(contact.id)
        );
        
        setContactsWithTags(filteredContacts);
      } catch (error) {
        console.error('Error filtering contacts by tags:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContactsByTags();
  }, [contacts, selectedTagIds]);

  return {
    filteredContacts: contactsWithTags,
    isLoading
  };
}
