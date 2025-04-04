
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bell } from "lucide-react";
import { InteractionsList } from "@/components/crm/InteractionsList";
import { RemindersSection } from "@/components/crm/RemindersSection";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ContactDetailProps {
  contact: Contact | null;
  onOpenAddInteraction: () => void;
}

export function ContactDetail({ contact, onOpenAddInteraction }: ContactDetailProps) {
  const [activeSection, setActiveSection] = useState<'interactions' | 'reminders'>('interactions');

  if (!contact) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Select a contact to view their interactions
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {contact.first_name} {contact.last_name}
        </CardTitle>
        <CardDescription>
          {contact.company} - {contact.position}
        </CardDescription>
        <div className="flex space-x-2 mt-4 border-b pb-2">
          <Button 
            variant={activeSection === 'interactions' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveSection('interactions')}
            className="rounded-full"
          >
            Interactions
          </Button>
          <Button 
            variant={activeSection === 'reminders' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveSection('reminders')}
            className="rounded-full"
          >
            <Bell className="mr-1 h-4 w-4" />
            Reminders
            <Badge variant="secondary" className="ml-1">New</Badge>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeSection === 'interactions' ? (
          <>
            <InteractionsList contactId={contact.id} />
            <div className="mt-4">
              <Button onClick={onOpenAddInteraction}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Interaction
              </Button>
            </div>
          </>
        ) : (
          <RemindersSection contactId={contact.id} />
        )}
      </CardContent>
    </Card>
  );
}
