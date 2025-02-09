
'use client'
import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import toast from 'react-hot-toast';
import axios from 'axios';

interface Question {
  slug: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  difficulty: "BEGINNER" | "EASY" | "MEDIUM" | "HARD" | "VERYHARD";
  points: number;
  tags: string[];
  platform: "Leetcode" | "Codeforces";
}

const difficultyPoints = {
  BEGINNER: 20,
  EASY: 40,
  MEDIUM: 80,
  HARD: 120,
  VERYHARD: 140,
};

const availableTags = [
  "PrefixSum", "TwoPointers", "1D Arrays", "Graph", "2D Arrays",
  "Time complexity", "Basic Maths", "Space complexity", "BinarySearch",
  "DP", "Sorting", "Linear search", "Exponentiation", "Recursion"
];

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    BEGINNER: "bg-blue-500/10 text-blue-500",
    EASY: "bg-green-500/10 text-green-500",
    MEDIUM: "bg-yellow-500/10 text-yellow-500",
    HARD: "bg-orange-500/10 text-orange-500",
    VERYHARD: "bg-red-500/10 text-red-500"
  };
  return colors[difficulty as keyof typeof colors];
};

export default function QuestionForm() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        slug: "",
        leetcodeUrl: "",
        codeforcesUrl: "",
        difficulty: "BEGINNER",
        points: 20,
        tags: [],
        platform: "Leetcode",
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => {
        if (i === index) {
          const updatedQuestion = { ...q, [field]: value };
          if (field === "platform") {
            updatedQuestion.leetcodeUrl = value === "Leetcode" ? updatedQuestion.leetcodeUrl : "";
            updatedQuestion.codeforcesUrl = value === "Codeforces" ? updatedQuestion.codeforcesUrl : "";
          } else if (field === "difficulty") {
            updatedQuestion.points = difficultyPoints[value as keyof typeof difficultyPoints];
          }
          return updatedQuestion;
        }
        return q;
      })
    );
  };

  const handleTagChange = (index: number, selectedTags: string[]) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => (i === index ? { ...q, tags: selectedTags } : q))
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/questionsInput", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questions),
      });

      if (response.status === 200) {
        toast.success("Questions Added Successfully");
        setQuestions([]);
      }
    } catch (error) {
      console.log(error)
      toast.error("Questions were not created!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Contest Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q, index) => (
            <Card key={index} className="border border-border/50">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Question Name</Label>
                  <Input
                    placeholder="Enter question name"
                    value={q.slug}
                    onChange={(e) => updateQuestion(index, "slug", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={q.platform}
                    onValueChange={(value) => updateQuestion(index, "platform", value)}
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

                {q.platform === "Leetcode" && (
                  <div className="space-y-2">
                    <Label>Leetcode URL</Label>
                    <Input
                      placeholder="Enter Leetcode URL"
                      value={q.leetcodeUrl}
                      onChange={(e) => updateQuestion(index, "leetcodeUrl", e.target.value)}
                    />
                  </div>
                )}

                {q.platform === "Codeforces" && (
                  <div className="space-y-2">
                    <Label>Codeforces URL</Label>
                    <Input
                      placeholder="Enter Codeforces URL"
                      value={q.codeforcesUrl}
                      onChange={(e) => updateQuestion(index, "codeforcesUrl", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={q.difficulty}
                    onValueChange={(value) => updateQuestion(index, "difficulty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(difficultyPoints).map((level) => (
                        <SelectItem key={level} value={level}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md ${getDifficultyColor(level)}`}>
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
                        variant={q.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newTags = q.tags.includes(tag)
                            ? q.tags.filter((t) => t !== tag)
                            : [...q.tags, tag];
                          handleTagChange(index, newTags);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-sm">
                    Points: {q.points}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={addQuestion}
          >
            Add Question
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}