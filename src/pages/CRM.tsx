
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContactsList } from "@/components/crm/ContactsList";
import { SearchBar } from "@/components/crm/SearchBar";
import { ContactDetail } from "@/components/crm/ContactDetail";
import { AddInteractionDialog } from "@/components/crm/AddInteractionDialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

export default function CRM() {
  const [activeTab, setActiveTab] = useState<string>("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddInteractionDialog, setShowAddInteractionDialog] = useState(false);
  const { toast } = useToast();
  
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
          description: "Failed to load contacts. Please try again.",
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
  
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.company && contact.company.toLowerCase().includes(query))
    );
  });

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setActiveTab("interactions");
  };

  const handleOpenAddInteraction = () => {
    if (!selectedContact) {
      toast({
        title: "No contact selected",
        description: "Please select a contact first to add an interaction.",
        variant: "destructive",
      });
      return;
    }
    setShowAddInteractionDialog(true);
  };

  const handleInteractionAdded = () => {
    toast({
      title: "Success",
      description: "Interaction added successfully."
    });
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">CRM</h1>
        <Button onClick={handleOpenAddInteraction}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Interaction
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="space-y-4">
          <ContactsList 
            contacts={filteredContacts} 
            isLoading={isLoading} 
            onSelectContact={handleSelectContact}
          />
        </TabsContent>
        
        <TabsContent value="interactions" className="space-y-4">
          <ContactDetail 
            contact={selectedContact}
            onOpenAddInteraction={handleOpenAddInteraction}
          />
        </TabsContent>
      </Tabs>
      
      {showAddInteractionDialog && selectedContact && (
        <AddInteractionDialog
          contact={selectedContact}
          open={showAddInteractionDialog}
          onOpenChange={setShowAddInteractionDialog}
          onSuccess={handleInteractionAdded}
        />
      )}
    </MainLayout>
  );
}
