
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ContactsEmptyState() {
  return (
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
  );
}
