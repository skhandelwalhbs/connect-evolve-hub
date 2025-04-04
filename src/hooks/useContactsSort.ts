
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];
export type SortField = keyof Pick<Contact, 'first_name' | 'company' | 'position' | 'location' | 'email' | 'created_at' | 'updated_at'>;
export type SortDirection = 'asc' | 'desc';

export function useContactsSort() {
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortContacts = (contacts: Contact[]): Contact[] => {
    return [...contacts].sort((a, b) => {
      let valueA, valueB;

      if (sortField === 'first_name') {
        valueA = `${a.first_name} ${a.last_name}`.toLowerCase();
        valueB = `${b.first_name} ${b.last_name}`.toLowerCase();
      } else if (sortField === 'email') {
        valueA = (a.email || '').toLowerCase();
        valueB = (b.email || '').toLowerCase();
      } else if (sortField === 'created_at' || sortField === 'updated_at') {
        valueA = new Date(a[sortField]).getTime();
        valueB = new Date(b[sortField]).getTime();
      } else {
        valueA = (a[sortField] || '').toString().toLowerCase();
        valueB = (b[sortField] || '').toString().toLowerCase();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  return {
    sortField,
    sortDirection,
    handleSort,
    sortContacts
  };
}
