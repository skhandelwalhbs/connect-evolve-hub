
import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, MessageSquare, User, Briefcase, MapPin, Link2, Clock, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { AddInteractionDialog } from "@/components/crm/AddInteractionDialog";
import { TagsList } from "@/components/tags/TagsList";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];
type SortField = keyof Pick<Contact, 'first_name' | 'company' | 'position' | 'location' | 'email' | 'created_at'>;
type SortDirection = 'asc' | 'desc';

interface ContactsListProps {
  contacts: Contact[];
  isLoading: boolean;
  onSelectContact: (contact: Contact) => void;
}

export function ContactsList({ contacts, isLoading, onSelectContact }: ContactsListProps) {
  const [contactForInteraction, setContactForInteraction] = useState<Contact | null>(null);
  const [showAddInteractionDialog, setShowAddInteractionDialog] = useState(false);
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const handleAddInteraction = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    setContactForInteraction(contact);
    setShowAddInteractionDialog(true);
  };

  const handleInteractionAdded = () => {
    setShowAddInteractionDialog(false);
    setContactForInteraction(null);
  };

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

  const sortedContacts = [...contacts].sort((a, b) => {
    let valueA, valueB;

    if (sortField === 'first_name') {
      valueA = `${a.first_name} ${a.last_name}`.toLowerCase();
      valueB = `${b.first_name} ${b.last_name}`.toLowerCase();
    } else if (sortField === 'email') {
      valueA = (a.email || '').toLowerCase();
      valueB = (b.email || '').toLowerCase();
    } else if (sortField === 'created_at') {
      valueA = new Date(a.created_at).getTime();
      valueB = new Date(b.created_at).getTime();
    } else {
      valueA = (a[sortField] || '').toString().toLowerCase();
      valueB = (b[sortField] || '').toString().toLowerCase();
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium">No contacts found</h3>
          <p className="text-muted-foreground mt-1">
            Add contacts to start managing your relationships
          </p>
        </div>
      </div>
    );
  }

  return (
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
            <TableHead>Tags</TableHead>
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
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => (
            <TableRow 
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="cursor-pointer hover:bg-muted"
            >
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  {contact.first_name} {contact.last_name}
                </div>
              </TableCell>
              <TableCell>
                <TagsList contactId={contact.id} />
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
              <TableCell>
                {contact.notes ? (
                  <div className="flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <span className="max-w-[180px] truncate block" title={contact.notes}>
                      {contact.notes.length > 30 ? `${contact.notes.substring(0, 30)}...` : contact.notes}
                    </span>
                  </div>
                ) : "-"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleAddInteraction(e, contact)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Add Interaction
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Interaction Dialog */}
      {contactForInteraction && (
        <AddInteractionDialog
          contact={contactForInteraction}
          open={showAddInteractionDialog}
          onOpenChange={setShowAddInteractionDialog}
          onSuccess={handleInteractionAdded}
        />
      )}
    </div>
  );
}
