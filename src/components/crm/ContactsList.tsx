
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, Star } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ContactsListProps {
  contacts: Contact[];
  isLoading: boolean;
  onSelectContact: (contact: Contact) => void;
}

export function ContactsList({ contacts, isLoading, onSelectContact }: ContactsListProps) {
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => (
        <Card key={contact.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>{contact.first_name} {contact.last_name}</CardTitle>
              <Badge variant="outline" className="ml-2">
                {contact.position}
              </Badge>
            </div>
            <CardDescription>
              {contact.company}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
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
              <div className="flex items-center text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Added on {new Date(contact.created_at).toLocaleDateString()}
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={() => onSelectContact(contact)}
            >
              View Interactions
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
