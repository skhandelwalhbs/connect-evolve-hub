
import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, MessageSquare, User, Briefcase, MapPin, Link2, Clock } from "lucide-react";
import { AddInteractionDialog } from "@/components/crm/AddInteractionDialog";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ContactsListProps {
  contacts: Contact[];
  isLoading: boolean;
  onSelectContact: (contact: Contact) => void;
}

export function ContactsList({ contacts, isLoading, onSelectContact }: ContactsListProps) {
  const [contactForInteraction, setContactForInteraction] = useState<Contact | null>(null);
  const [showAddInteractionDialog, setShowAddInteractionDialog] = useState(false);

  const handleAddInteraction = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    setContactForInteraction(contact);
    setShowAddInteractionDialog(true);
  };

  const handleInteractionAdded = () => {
    setShowAddInteractionDialog(false);
    setContactForInteraction(null);
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
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
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
