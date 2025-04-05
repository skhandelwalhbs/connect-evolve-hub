
import { MainLayout } from "@/components/layouts/MainLayout";
import { TagManager } from "@/components/tags/TagManager";

export default function TagManagement() {
  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tag Management</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <TagManager />
      </div>
    </MainLayout>
  );
}
