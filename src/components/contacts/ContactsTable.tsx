
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Pencil, Trash2, MapPin, Briefcase, User, Clock, Link2, ArrowUp, ArrowDown } from "lucide-react";
import { TagsList } from "@/components/tags/TagsList";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];
type SortField = keyof Pick<Contact, 'first_name' | 'company' | 'position' | 'location' | 'email' | 'created_at' | 'updated_at'>;
type SortDirection = 'asc' | 'desc';

interface ContactsTableProps {
  contacts: Contact[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
}

export function ContactsTable({
  contacts,
  sortField,
  sortDirection,
  onSort,
  onEditContact,
  onDeleteContact
}: ContactsTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSort('first_name')}
            >
              <div className="flex items-center">
                Name {getSortIcon('first_name')}
              </div>
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSort('company')}
            >
              <div className="flex items-center">
                Company {getSortIcon('company')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSort('position')}
            >
              <div className="flex items-center">
                Position {getSortIcon('position')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSort('location')}
            >
              <div className="flex items-center">
                Location {getSortIcon('location')}
              </div>
            </TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>URL</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSort('created_at')}
            >
              <div className="flex items-center">
                Added {getSortIcon('created_at')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSort('updated_at')}
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
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id}
              onClick={() => onEditContact(contact)}
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
                      onEditContact(contact);
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
                      onDeleteContact(contact);
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
  );
}
