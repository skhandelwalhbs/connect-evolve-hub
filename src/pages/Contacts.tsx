
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Search } from "lucide-react";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <AddContactDialog />
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="ml-2">
          Filter
        </Button>
      </div>
      
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium">No contacts yet</h3>
          <p className="text-muted-foreground mt-1">
            Get started by adding your first contact
          </p>
          <AddContactDialog trigger={
            <Button className="mt-4">
              Add Your First Contact
            </Button>
          } />
        </div>
      </div>
    </MainLayout>
  );
}
