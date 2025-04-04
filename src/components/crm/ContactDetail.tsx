
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InteractionsList } from "@/components/crm/InteractionsList";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ContactDetailProps {
  contact: Contact | null;
  onOpenAddInteraction: () => void;
}

export function ContactDetail({ contact, onOpenAddInteraction }: ContactDetailProps) {
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
      </CardHeader>
      <CardContent>
        <InteractionsList contactId={contact.id} />
        <div className="mt-4">
          <Button onClick={onOpenAddInteraction}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Interaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
