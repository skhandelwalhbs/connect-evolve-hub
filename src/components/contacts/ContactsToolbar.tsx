
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { TagFilter } from "@/components/tags/TagFilter";

interface ContactsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTagIds: string[];
  onTagsChange: (selectedTags: string[]) => void;
}

export function ContactsToolbar({ 
  searchQuery, 
  onSearchChange,
  selectedTagIds,
  onTagsChange
}: ContactsToolbarProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <Button asChild>
          <Link to="/contacts/add">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <TagFilter 
          selectedTagIds={selectedTagIds}
          onTagsChange={onTagsChange}
        />
      </div>
    </>
  );
}
