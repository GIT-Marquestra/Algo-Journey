import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Edit, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HintsComponentProps {
  questionId: string;
  questionSlug: string;
  isAdmin?: boolean;
  children?: ReactNode;
  onSave?: () => void;
}

interface Hint {
  hint1: string;
  hint2: string;
  hint3: string;
}

export function HintsComponent({ 
  questionId, 
  questionSlug, 
  isAdmin = false,
  children,
  onSave 
}: HintsComponentProps) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<Hint>({
    hint1: "",
    hint2: "",
    hint3: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hint1");
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  // Fetch existing hints when modal opens
  useEffect(() => {
    const fetchHints = async () => {
      if (!open) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/hints/${questionId}`);
        
        if (response.ok) {
          const data = await response.json();
          setHint({
            hint1: data.hint1 || "",
            hint2: data.hint2 || "",
            hint3: data.hint3 || "",
          });
        }
      } catch (error) {
        console.error("Error fetching hints:", error);
        toast({
          title: "Error",
          description: "Could not load hints. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHints();
  }, [questionId, open, toast]);

  const handleInputChange = (field: keyof Hint, value: string) => {
    setHint((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!hint.hint1.trim() || !hint.hint2.trim() || !hint.hint3.trim()) {
      toast({
        title: "Validation Error",
        description: "All three hints are required.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      const response = await fetch("/api/hints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          ...hint,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save hints");
      }

      toast({
        title: "Success",
        description: "Hints saved successfully!",
        variant: "default",
      });
      
      if (onSave) {
        onSave();
      }
      
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving hints:", error);
      toast({
        title: "Error",
        description: "Failed to save hints. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="hint1">Hint 1</TabsTrigger>
        <TabsTrigger value="hint2">Hint 2</TabsTrigger>
        <TabsTrigger value="hint3">Solution Approach</TabsTrigger>
      </TabsList>
      
      <TabsContent value="hint1">
        <Textarea
          id="hint1"
          placeholder="Enter the first hint (basic direction)"
          value={hint.hint1}
          onChange={(e) => handleInputChange("hint1", e.target.value)}
          className="min-h-32 whitespace-pre-wrap"
        />
      </TabsContent>
      
      <TabsContent value="hint2">
        <Textarea
          id="hint2"
          placeholder="Enter the second hint (more specific approach)"
          value={hint.hint2}
          onChange={(e) => handleInputChange("hint2", e.target.value)}
          className="min-h-32 whitespace-pre-wrap"
        />
      </TabsContent>
      
      <TabsContent value="hint3">
        <Textarea
          id="hint3"
          placeholder="Enter the third hint (almost solution)"
          value={hint.hint3}
          onChange={(e) => handleInputChange("hint3", e.target.value)}
          className="min-h-32 whitespace-pre-wrap"
        />
      </TabsContent>
    </Tabs>
  );

  const renderReadOnlyTabs = () => (
    <Tabs defaultValue="hint1" className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="hint1">Hint 1</TabsTrigger>
        <TabsTrigger value="hint2">Hint 2</TabsTrigger>
        <TabsTrigger value="hint3">Hint 3</TabsTrigger>
      </TabsList>
      <TabsContent value="hint1" className="p-4 bg-amber-50 rounded-md">
        <p className="whitespace-pre-wrap">{hint.hint1 || "No hint available."}</p>
      </TabsContent>
      <TabsContent value="hint2" className="p-4 bg-amber-50 rounded-md">
        <p className="whitespace-pre-wrap">{hint.hint2 || "No hint available."}</p>
      </TabsContent>
      <TabsContent value="hint3" className="p-4 bg-amber-50 rounded-md">
        <p className="whitespace-pre-wrap">{hint.hint3 || "No hint available."}</p>
      </TabsContent>
    </Tabs>
  );

  // Handle direct opening for admin double-click
  const handleAdminOpen = () => {
    setIsEditMode(true);
    setOpen(true);
  };

  // Default button if no children provided
  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="border-amber-200 text-amber-700 hover:bg-amber-50"
    >
      <Sparkles className="mr-1 h-4 w-4" />
      Hints
    </Button>
  );

  return (
    <>
      {/* For admin double-click functionality */}
      {isAdmin && children && (
        <div
          onDoubleClick={handleAdminOpen}
          className="cursor-pointer"
          title="Double-click to edit hints"
        >
          {children}
        </div>
      )}
      
      {/* Regular dialog with trigger */}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Only render DialogTrigger when we have no direct open method (non-admin or no children) */}
        {(!isAdmin || !children) && (
          <DialogTrigger asChild>
            {children || defaultTrigger}
          </DialogTrigger>
        )}
        
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">
                {isEditMode ? `Edit Hints: ${questionSlug}` : `Hints for ${questionSlug}`}
              </DialogTitle>
              {isAdmin && !isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditMode(true)}
                  className="text-indigo-600"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {isEditMode ? renderEditableTabs() : renderReadOnlyTabs()}
              
              {isEditMode && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditMode(false);
                      if (!hint.hint1 && !hint.hint2 && !hint.hint3) {
                        setOpen(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save All Hints
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}