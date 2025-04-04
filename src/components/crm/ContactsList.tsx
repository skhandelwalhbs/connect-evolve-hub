
import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, MessageSquare, User, Briefcase, MapPin, Link2, Clock, FileText, Tag as TagIcon } from "lucide-react";
import { AddInteractionDialog } from "@/components/crm/AddInteractionDialog";
import { Tag } from "@/components/tags/Tag";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface ContactsListProps {
  contacts: Contact[];
  isLoading: boolean;
  onSelectContact: (contact: Contact) => void;
}

export function ContactsList({ contacts, isLoading, onSelectContact }: ContactsListProps) {
  const [contactForInteraction, setContactForInteraction] = useState<Contact | null>(null);
  const [showAddInteractionDialog, setShowAddInteractionDialog] = useState(false);
  const [contactTags, setContactTags] = useState<Record<string, Tag[]>>({});

  useEffect(() => {
    if (contacts.length > 0) {
      fetchContactTags(contacts.map(c => c.id));
    }
  }, [contacts]);

  const fetchContactTags = async (contactIds: string[]) => {
    try {
      // First get all contact_tags relationships for these contacts
      const { data: relationships, error: relError } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id')
        .in('contact_id', contactIds);
      
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
        .in('id', tagIds);
        
      if (tagError) {
        console.error("Error fetching tags:", tagError);
        return;
      }
      
      if (!tags) {
        return;
      }
      
      // Create a map of contact IDs to tags
      const tagsMap: Record<string, Tag[]> = {};
      
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
            <TableHead>Tags</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Notes</TableHead>
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
              <TableCell>
                <div className="flex items-center flex-wrap gap-1 min-w-[100px] max-w-[200px]">
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
