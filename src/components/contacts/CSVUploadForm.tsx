
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Template CSV content
const csvTemplate = `first_name,last_name,email,phone,company,job_title,notes
John,Doe,john@example.com,555-123-4567,Acme Inc,Product Manager,Met at Tech Conference
Jane,Smith,jane@example.com,555-987-6543,XYZ Corp,CEO,Introduced by Mike
`;

export function CSVUploadForm() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setProgress(10);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add contacts.",
          variant: "destructive",
        });
        return;
      }
      
      // Read the CSV file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          setProgress(30);
          const csvData = e.target?.result as string;
          const lines = csvData.split("\n");
          
          // Extract header and check required columns
          const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
          const requiredColumns = ["first_name", "last_name"];
          
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          if (missingColumns.length > 0) {
            toast({
              title: "Invalid CSV Format",
              description: `Missing required columns: ${missingColumns.join(", ")}`,
              variant: "destructive",
            });
            return;
          }
          
          // Process data rows
          const contacts = [];
          setProgress(50);
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(",");
            if (values.length !== headers.length) {
              toast({
                title: "Invalid CSV Row",
                description: `Row ${i} has an incorrect number of values`,
                variant: "destructive",
              });
              continue;
            }
            
            const contact: Record<string, any> = {
              user_id: user.id
            };
            
            headers.forEach((header, index) => {
              if (values[index]) {
                contact[header] = values[index].trim();
              }
            });
            
            contacts.push(contact);
          }
          
          if (contacts.length === 0) {
            toast({
              title: "No Valid Contacts",
              description: "No valid contacts were found in the CSV file.",
              variant: "destructive",
            });
            return;
          }
          
          setProgress(70);
          
          // Insert contacts in batches to avoid hitting limits
          const batchSize = 20;
          let successCount = 0;
          
          for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, i + batchSize);
            const { data, error } = await supabase
              .from('contacts')
              .insert(batch);
              
            if (error) {
              console.error("Error adding contacts batch:", error);
            } else {
              successCount += batch.length;
            }
            
            // Update progress based on batch completion
            setProgress(70 + Math.round((i / contacts.length) * 30));
          }
          
          setProgress(100);
          
          if (successCount === 0) {
            toast({
              title: "Upload Failed",
              description: "Failed to add any contacts. Please check the file format and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Upload Complete",
              description: `Successfully added ${successCount} contacts${
                successCount < contacts.length ? ` (${contacts.length - successCount} failed)` : ""
              }.`,
            });
            setFile(null);
            // Reset the file input
            if (document.getElementById("csvFile") as HTMLInputElement) {
              (document.getElementById("csvFile") as HTMLInputElement).value = "";
            }
          }
        } catch (error) {
          console.error("CSV processing error:", error);
          toast({
            title: "Processing Error",
            description: "Failed to process the CSV file. Please check the format and try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
          setProgress(0);
        }
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-md p-4 mb-6">
          <h3 className="font-medium mb-2">CSV Format Requirements</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Your CSV file should include these columns (first_name and last_name are required):
          </p>
          <ul className="list-disc text-sm text-muted-foreground ml-5 space-y-1">
            <li>first_name</li>
            <li>last_name</li>
            <li>email</li>
            <li>phone</li>
            <li>company</li>
            <li>job_title</li>
            <li>notes</li>
          </ul>
          <div className="mt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={downloadTemplate}
              className="text-sm"
            >
              Download Template
            </Button>
          </div>
        </div>

        <form onSubmit={handleUpload}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button 
                  type="submit" 
                  disabled={!file || isUploading}
                  className="whitespace-nowrap"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
            
            {isUploading && (
              <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{width: `${progress}%`}}
                ></div>
              </div>
            )}
            
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
