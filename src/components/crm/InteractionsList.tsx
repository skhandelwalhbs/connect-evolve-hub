
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Interaction = Database['public']['Tables']['contact_interactions']['Row'];

interface InteractionsListProps {
  contactId: string;
}

export function InteractionsList({ contactId }: InteractionsListProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInteractions();
  }, [contactId]);

  const fetchInteractions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching interactions:", error);
        toast({
          title: "Error",
          description: "Failed to load interaction history. Please try again.",
          variant: "destructive",
        });
      } else {
        setInteractions(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No interactions recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Interaction History</h3>
      <div className="space-y-4">
        {interactions.map((interaction) => (
          <div key={interaction.id} className="border rounded-md p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">{interaction.type}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {new Date(interaction.date).toLocaleDateString()}
              </div>
            </div>
            <p className="text-sm mb-2">{interaction.notes || "No notes"}</p>
            <div className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Added on {new Date(interaction.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
