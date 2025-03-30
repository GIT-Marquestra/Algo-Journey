"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import toast from "react-hot-toast";

const TagManager = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get("/api/getTags");
        setTags(res.data.map((tag: { name: string }) => tag.name));
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const saveTags = async () => {
    try {
      const res = await axios.post("/api/updateTags" ,{
        tags
      })

      if(res.status !== 200){
        toast.error('Unable to upload')
        return 
      }

      toast.success('Tags Uploaded')
      
    } catch (error) {
      console.error("Error updating tags:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Manage Tags</h2>
      
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Enter a tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <Button onClick={addTag}>Add</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-md">
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-2 text-white">
              &times;
            </button>
          </span>
        ))}
      </div>

      <Button className="mt-4" onClick={saveTags}>Save Tags</Button>
    </div>
  );
};

export default TagManager;