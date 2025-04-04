import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Search, Mail, Phone, UserPlus, Pencil, Trash2, MapPin, Briefcase, User, Clock, Link2, Tag as TagIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tag } from "@/components/tags/Tag";
import { Tag as TagType } from "@/types/database-extensions";

type Contact = Database['public']['Tables']['contacts']['Row'];

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [contactTags, setContactTags] = useState<Record<string, TagType[]>>({});
  const { toast } = useToast();
  
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
        if (data && data.length > 0) {
          fetchContactTags(data.map(contact => contact.id));
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tags for all contacts
  const fetchContactTags = async (contactIds: string[]) => {
    try {
      // First get all contact_tags relationships for these contacts
      const { data: relationships, error: relError } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id')
        .in('contact_id', contactIds) as unknown as { data: { contact_id: string, tag_id: string }[] | null; error: any };
      
      if (relError) {
        console.error("Error fetching tag relationships:", relError);
        return;
      }
      
      if (!relationships || relationships.length === 0) {
        return;
      }
      
      // Get all unique tag IDs from these relationships
      const tagIds = [...new Set(relationships.map(rel => rel.tag_id))];
      
      // Fetch all of these tags at once
      const { data: tags, error: tagError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds) as unknown as { data: TagType[] | null; error: any };
        
      if (tagError) {
        console.error("Error fetching tags:", tagError);
        return;
      }
      
      if (!tags) {
        return;
      }
      
      // Create a map of contact IDs to tags
      const tagsMap: Record<string, TagType[]> = {};
      
      // For each contact, find all their tags
      contactIds.forEach(contactId => {
        const contactTagIds = relationships
          .filter(rel => rel.contact_id === contactId)
          .map(rel => rel.tag_id);
          
        const contactTagsArray = tags.filter(tag => contactTagIds.includes(tag.id));
        
        if (contactTagsArray.length > 0) {
          tagsMap[contactId] = contactTagsArray;
        }
      });
      
      setContactTags(tagsMap);
    } catch (error) {
      console.error("Error in fetchContactTags:", error);
    }
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
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

  // Handle row click to open edit dialog
  const handleRowClick = (contact: Contact) => {
    setContactToEdit(contact);
  };

  // JSX
  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to="/tags">
              <TagIcon className="mr-2 h-4 w-4" />
              Manage Tags
            </Link>
          </Button>
          <Button asChild>
            <Link to="/contacts/add">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="ml-2">
          Filter
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-md border">
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium">No contacts yet</h3>
            <p className="text-muted-foreground mt-1">
              Get started by adding your first contact
            </p>
            <Button className="mt-4" asChild>
              <Link to="/contacts/add">
                Add Your First Contact
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow 
                  key={contact.id}
                  onClick={() => handleRowClick(contact)}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {contact.first_name} {contact.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {contact.company || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{contact.position || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {contact.location || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1 min-w-[180px]">
                      {contact.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.url ? (
                      <div className="flex items-center text-sm">
                        <Link2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <a 
                          href={contact.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking the link
                        >
                          Profile Link
                        </a>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 min-w-[100px] max-w-[200px]">
                      {contactTags[contact.id] && contactTags[contact.id].length > 0 ? (
                        contactTags[contact.id].map(tag => (
                          <Tag key={tag.id} tag={tag} className="text-xs" />
                        ))
                      ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <TagIcon className="h-3.5 w-3.5 mr-1.5" />
                          No tags
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {new Date(contact.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(contact.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {contact.notes ? (
                      <span className="max-w-xs truncate block" title={contact.notes}>
                        {contact.notes.length > 30 ? `${contact.notes.substring(0, 30)}...` : contact.notes}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}> {/* Prevent row click when clicking action buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactToEdit(contact);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactToDelete(contact);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
