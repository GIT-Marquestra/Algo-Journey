import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Pencil } from "lucide-react";
import toast from 'react-hot-toast';
import axios from 'axios';

type Difficulty = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERYHARD';
type Platform = 'Leetcode' | 'Codeforces';

interface QuestionTag {
  id: string;
  name: string;
}

interface Question {
  id: string;
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  questionTags: QuestionTag[];
  slug: string;
  difficulty: Difficulty;
}

interface FormData {
  id: string;
  slug: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  difficulty: Difficulty;
  tags: QuestionTag[];
  platform: Platform;
  points?: number;
}

interface Props {
  question: Question;
}

const difficultyPoints: Record<Difficulty, number> = {
  BEGINNER: 2,
  EASY: 4,
  MEDIUM: 6,
  HARD: 8,
  VERYHARD: 10,
};

const availableTags = [
  "PrefixSum",
  "TwoPointers",
  "1DArrays",
  "Graph",
  "2DArrays",
  "TimeComplexity",
  "BasicMaths",
  "SpaceComplexity",
  "BinarySearch",
  "DP",
  "Sorting",
  "LinearSearch",
  "Exponentiation",
  "Recursion",
  "String"
] as const;

const difficultyColors: Record<Difficulty, string> = {
  BEGINNER: "bg-blue-500/10 text-blue-500",
  EASY: "bg-green-500/10 text-green-500",
  MEDIUM: "bg-yellow-500/10 text-yellow-500",
  HARD: "bg-orange-500/10 text-orange-500",
  VERYHARD: "bg-red-500/10 text-red-500"
};

const EditQuestionModal: React.FC<Props> = ({ question }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: question.id,
    slug: question.slug,
    leetcodeUrl: question.leetcodeUrl || '',
    codeforcesUrl: question.codeforcesUrl || '',
    difficulty: question.difficulty,
    tags: question.questionTags,
    platform: question.leetcodeUrl ? 'Leetcode' : 'Codeforces',
    points: difficultyPoints[question.difficulty]
  });

  const handleUpdate = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/updateQuestion', formData);
      if (response.status === 200) {
        toast.success('Question updated successfully');
        setIsOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]): void => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'platform') {
        updated.leetcodeUrl = value === 'Leetcode' ? updated.leetcodeUrl : '';
        updated.codeforcesUrl = value === 'Codeforces' ? updated.codeforcesUrl : '';
      } else if (field === 'difficulty' && typeof value === 'string') {
        updated.points = difficultyPoints[value as Difficulty];
      }
      return updated;
    });
  };

  const handleTagToggle = (tag: string): void => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.some(t => t.name === tag)
        ? prev.tags.filter(t => t.name !== tag)
        : [...prev.tags, { id: crypto.randomUUID(), name: tag }]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Question Name</Label>
            <Input
              value={formData.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              placeholder="Enter question name"
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value: Platform) => updateField('platform', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leetcode">Leetcode</SelectItem>
                <SelectItem value="Codeforces">Codeforces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.platform === 'Leetcode' && (
            <div className="space-y-2">
              <Label>Leetcode URL</Label>
              <Input
                value={formData.leetcodeUrl}
                onChange={(e) => updateField('leetcodeUrl', e.target.value)}
                placeholder="Enter Leetcode URL"
              />
            </div>
          )}

          {formData.platform === 'Codeforces' && (
            <div className="space-y-2">
              <Label>Codeforces URL</Label>
              <Input
                value={formData.codeforcesUrl}
                onChange={(e) => updateField('codeforcesUrl', e.target.value)}
                placeholder="Enter Codeforces URL"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: Difficulty) => updateField('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(difficultyPoints) as Difficulty[]).map((level) => (
                  <SelectItem key={level} value={level}>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md ${difficultyColors[level]}`}>
                      {level}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.some(t => t.name === tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {formData.points && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                Points: {formData.points}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionModal;