
import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ArrowLeft, FileText, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVUploadForm } from "@/components/contacts/CSVUploadForm";
import { ManualContactForm } from "@/components/contacts/ManualContactForm";

export default function AddContact() {
  const [activeTab, setActiveTab] = useState<string>("manual");
  
  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link to="/contacts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Contacts</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="mt-0">
            <div className="border rounded-md p-6">
              <ManualContactForm />
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="mt-0">
            <div className="border rounded-md p-6">
              <CSVUploadForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
