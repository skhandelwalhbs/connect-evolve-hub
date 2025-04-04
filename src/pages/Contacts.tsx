
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Search, Mail, Phone, UserPlus, Pencil, Trash2, MapPin, Briefcase, User, Clock, Link2, ArrowUp, ArrowDown } from "lucide-react";
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
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];
type SortField = keyof Pick<Contact, 'first_name' | 'company' | 'position' | 'location' | 'email' | 'created_at' | 'updated_at'>;
type SortDirection = 'asc' | 'desc';

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sorting
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
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

  // Sort contacts based on sort field and direction
  const sortedContacts = [...filteredContacts].sort((a, b) => {
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

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <Button asChild>
          <Link to="/contacts/add">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
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
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center">
                    Name {getSortIcon('first_name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center">
                    Company {getSortIcon('company')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center">
                    Position {getSortIcon('position')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center">
                    Location {getSortIcon('location')}
                  </div>
                </TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>URL</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Added {getSortIcon('created_at')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center">
                    Updated {getSortIcon('updated_at')}
                  </div>
                </TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContacts.map((contact) => (
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
