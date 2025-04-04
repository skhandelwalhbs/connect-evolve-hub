
import { useState, useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

export function useContactsFilter(contacts: Contact[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return (
        fullName.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query)) ||
        (contact.company && contact.company.toLowerCase().includes(query)) ||
        (contact.position && contact.position.toLowerCase().includes(query)) ||
        (contact.location && contact.location.toLowerCase().includes(query))
      );
    });
  }, [contacts, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredContacts
  };
}
