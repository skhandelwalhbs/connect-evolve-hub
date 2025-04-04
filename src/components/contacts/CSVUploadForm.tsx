
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Template CSV content
const csvTemplate = `first_name,last_name,email,phone,company,position,location,url,connected_on,notes
John,Doe,john@example.com,555-123-4567,Acme Inc,Product Manager,San Francisco,https://linkedin.com/in/johndoe,2023-05-15,Met at Tech Conference
Jane,Smith,jane@example.com,555-987-6543,XYZ Corp,CEO,New York,https://linkedin.com/in/janesmith,2023-06-20,Introduced by Mike
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
          const requiredColumns = ["first_name", "last_name", "company", "position", "location"];
          
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          if (missingColumns.length > 0) {
            toast({
              title: "Invalid CSV Format",
              description: `Missing required columns: ${missingColumns.join(", ")}`,
              variant: "destructive",
            });
            setIsUploading(false);
            setProgress(0);
            return;
          }
          
          // Process data rows
          const contacts = [];
          setProgress(50);
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Handle CSV values that might contain commas within quotes
            let values: string[] = [];
            let insideQuotes = false;
            let currentValue = '';
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
                insideQuotes = !insideQuotes;
              } else if (char === ',' && !insideQuotes) {
                values.push(currentValue);
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            
            values.push(currentValue); // Add the last value
            
            // Fall back to simple split if the values don't match the headers
            if (values.length !== headers.length) {
              console.log("Falling back to simple split for line:", line);
              values = line.split(",").map(v => v.trim());
            }
            
            // Skip if still doesn't match header count
            if (values.length !== headers.length) {
              console.log(`Row ${i} has incorrect number of values. Expected ${headers.length}, got ${values.length}`);
              continue;
            }
            
            const contact: Record<string, any> = {
              user_id: user.id
            };
            
            headers.forEach((header, index) => {
              if (values[index]) {
                // Trim quotes if present
                let value = values[index].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                  value = value.substring(1, value.length - 1);
                }
                contact[header] = value;
              }
            });
            
            // Check if the contact has the required fields
            const missingRequired = requiredColumns.filter(col => !contact[col]);
            
            if (missingRequired.length > 0) {
              console.log(`Row ${i} missing required fields: ${missingRequired.join(", ")}`);
              continue;
            }
            
            // Ensure connected_on is a valid date or set to current date
            if (!contact.connected_on || !isValidDate(contact.connected_on)) {
              contact.connected_on = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            }
            
            contacts.push(contact);
          }
          
          if (contacts.length === 0) {
            toast({
              title: "No Valid Contacts",
              description: "No valid contacts were found in the CSV file.",
              variant: "destructive",
            });
            setIsUploading(false);
            setProgress(0);
            return;
          }
          
          setProgress(70);
          console.log("Contacts to insert:", contacts);
          
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
  
  // Helper function to validate date format (YYYY-MM-DD)
  const isValidDate = (dateString: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  return (
    <div>
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-md p-4 mb-6">
          <h3 className="font-medium mb-2">CSV Format Requirements</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Your CSV file should include these columns (starred fields are required):
          </p>
          <ul className="list-disc text-sm text-muted-foreground ml-5 space-y-1">
            <li>first_name* (required)</li>
            <li>last_name* (required)</li>
            <li>email</li>
            <li>phone</li>
            <li>company* (required)</li>
            <li>position* (required)</li>
            <li>location* (required)</li>
            <li>url</li>
            <li>connected_on (format: YYYY-MM-DD)</li>
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

