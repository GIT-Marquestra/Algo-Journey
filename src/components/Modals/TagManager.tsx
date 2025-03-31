"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tag, Plus, X, Save } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TagManager = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/getTags");
        setTags(res.data.map((tag: { name: string }) => tag.name));
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast.error("Failed to load tags");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, []);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    } else if (tags.includes(newTag.trim())) {
      toast.error("Tag already exists");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const saveTags = async () => {
    try {
      setIsLoading(true);
      const res = await axios.post("/api/updateTags", {
        tags
      });

      if (res.status !== 200) {
        toast.error("Unable to update tags");
        return;
      }

      toast.success("Tags updated successfully");
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error updating tags:", error);
      toast.error("Failed to update tags");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 pt-20 space-y-8">
      <Card className="bg-white/90 shadow-sm hover:shadow-md transition-all border-gray-100">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-500" />
                Manage Tags
              </CardTitle>
              <CardDescription className="text-gray-500">
                Add, remove, and organize problem tags
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-6">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Enter a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={addTag}
              disabled={isLoading}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-32">
            {isLoading ? (
              <div className="w-full flex justify-center items-center py-8">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : tags.length > 0 ? (
              tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-1 hover:bg-indigo-200 transition-colors"
                >
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)} 
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    aria-label="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                No tags added yet. Add your first tag above.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 pt-4 flex justify-end">
          <Button
            className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
            onClick={() => setShowConfirmation(true)}
            disabled={isLoading}
          >
            <Save className="mr-1 h-4 w-4" /> Save Tags
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">Save Tags</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to save these changes? This will update all tags in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-600 border-gray-200 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-indigo-500 text-white hover:bg-indigo-600"
              onClick={saveTags}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TagManager;