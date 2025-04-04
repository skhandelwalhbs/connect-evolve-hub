
import { MainLayout } from "@/components/layouts/MainLayout";
import { TagsManager } from "@/components/tags/TagsManager";

export default function Tags() {
  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Tags</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <TagsManager />
      </div>
    </MainLayout>
  );
}
