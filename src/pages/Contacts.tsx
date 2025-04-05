import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactsEmptyState } from "@/components/contacts/ContactsEmptyState";
import { ContactsToolbar } from "@/components/contacts/ContactsToolbar";
import { ContactsLoading } from "@/components/contacts/ContactsLoading";
import { useContactsSort } from "@/hooks/useContactsSort";
import { useContactsFilter } from "@/hooks/useContactsFilter";
import { useContactsTagFilter } from "@/hooks/useContactsTagFilter";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { searchQuery, setSearchQuery, filteredContacts: textFilteredContacts } = useContactsFilter(contacts);
  const { filteredContacts: tagFilteredContacts, isLoading: isTagFilterLoading } = useContactsTagFilter(textFilteredContacts, selectedTagIds);
  const { sortField, sortDirection, handleSort, sortContacts } = useContactsSort();
  
  const sortedContacts = sortContacts(tagFilteredContacts);
  
  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);
  
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching contacts:", error);
        toast({
          title: "Error",
          description: "Failed to load your contacts. Please try again.",
          variant: "destructive",
        });
      } else {
        setContacts(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete contact function
  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactToDelete.id);
      
      if (error) {
        console.error("Error deleting contact:", error);
        toast({
          title: "Error",
          description: "Failed to delete the contact. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
        // Refresh contacts list
        fetchContacts();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setContactToDelete(null);
    }
  };

  const isFiltering = isLoading || isTagFilterLoading;

  return (
    <MainLayout>
      <ContactsToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTagIds={selectedTagIds}
        onTagsChange={setSelectedTagIds}
      />
      
      {isFiltering ? (
        <ContactsLoading />
      ) : contacts.length === 0 ? (
        <ContactsEmptyState />
      ) : (
        <ContactsTable
          contacts={sortedContacts}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEditContact={setContactToEdit}
          onDeleteContact={setContactToDelete}
        />
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {contactToDelete?.first_name} {contactToDelete?.last_name} 
              from your contacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Contact Dialog */}
      <EditContactDialog 
        contact={contactToEdit}
        open={!!contactToEdit}
        onOpenChange={(open) => !open && setContactToEdit(null)}
        onSuccess={fetchContacts}
      />
    </MainLayout>
  );
}
