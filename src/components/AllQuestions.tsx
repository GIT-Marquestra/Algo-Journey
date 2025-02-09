'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, Filter, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionForm from './QuestionsInput';

const AVAILABLE_TAGS = [
  "PrefixSum",
  "TwoPointers",
  "1D Arrays",
  "Graph",
  "2D Arrays",
  "Time complexity",
  "Basic Maths",
  "Space complexity",
  "BinarySearch",
  "DP",
  "Sorting",
  "Linear search",
  "Exponentiation",
  "Recursion"
];

const DIFFICULTY_LEVELS = [
  { id: "all", value: "all", label: "All Difficulties" },
  { id: "beginner", value: "BEGINNER", label: "Beginner" },
  { id: "easy", value: "EASY", label: "Easy" },
  { id: "medium", value: "MEDIUM", label: "Medium" },
  { id: "hard", value: "HARD", label: "Hard" },
  { id: "veryhard", value: "VERYHARD", label: "Very Hard" }
];

interface Question {
  id: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  questionTags: { id: string; name: string; }[];
  slug: string;
  difficulty: string;
}

export default function AllQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [show, setShow] = useState(true)


  const fetchQuestions = useCallback(async () => {
    try {
      // await new Promise((r) => (setTimeout(r, 5000)))
      const res = await axios.post('/api/checkIfAdmin')
      const response = await axios.post<{ questions: Question[] }>("/api/getQuestions");
      if(!res.data.isAdmin) {
        setShow(false)
        return
      } 
      console.log(res.data.isAdmin)
      if(res.data.isAdmin) setShow(true)
      
      console.log('response: ', response)
      setQuestions(response.data.questions);
      setFilteredQuestions(response.data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      EASY: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      MEDIUM: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      HARD: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      VERYHARD: 'bg-red-700/10 text-red-700 hover:bg-red-700/20'
    };
    return colors[difficulty.toUpperCase()] || 'bg-gray-500/10 text-gray-500';
  };

  useEffect(() => {
    let filtered = questions;

    // Apply difficulty filter first
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Then apply tag filter
    if (selectedTags?.length > 0) {
      filtered = filtered.filter(q => {
        const questionTagNames = q.questionTags.map(tag => tag.name);
        return selectedTags.some(selectedTag => questionTagNames.includes(selectedTag));
      });
    }

    setFilteredQuestions(filtered);
  }, [selectedTags, selectedDifficulty, questions]);

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
  };

  const addToTest = (question: Question) => {
    if (selectedQuestions?.some(q => q.id === question.id)) {
      toast.error("Question already added to test");
      return;
    }
    setSelectedQuestions(prev => [...prev, { ...question }]);
    toast.success("Question added to test");
  };

  const removeFromTest = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
    toast.success("Question removed from test");
  };

  const validateDates = () => {
    if (!startTime || !endTime) {
      setDateError("Please select both start and end times");
      return false;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      setDateError("Start time cannot be in the past");
      return false;
    }

    if (end <= start) {
      setDateError("End time must be after start time");
      return false;
    }

    setDateError("");
    return true;
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDateForPrisma = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const utcDate = new Date(date.getTime() - (offset * 60000));
    return utcDate.toISOString();
  };

  const handleCreateTest = async () => {
    if (show && selectedQuestions.length === 0) {
      toast.error("Please select at least one question to create a test.");
      return;
    }

    if (!validateDates()) {
      return;
    }

    setLoading(true);
    try {
      const testData = {
        questions: selectedQuestions,
        startTime: formatDateForPrisma(startTime),
        endTime: formatDateForPrisma(endTime)
      };

      await axios.post("/api/createTest", testData);
      toast.success("Test created successfully!");
      setSelectedQuestions([]);
      setStartTime("");
      setEndTime("");
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Failed to create test.");
    }
    setLoading(false);
  };


  return (
    <>
    {show ? <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Test Creation */}
        <div className="w-full md:w-1/3 space-y-6">
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Test Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">End Time</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                />
              </div>
              {dateError && (
                <p className="text-sm text-destructive">{dateError}</p>
              )}
            </CardContent>
          </Card>

          

          <Card>
            <CardHeader>
              <CardTitle>Selected Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {show && selectedQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions selected.</p>
              ) : (
                selectedQuestions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="font-medium">{q.slug}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromTest(q.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              <Button
                className="w-full mt-4"
                onClick={handleCreateTest}
                disabled={loading}
              >
                {loading ? "Creating Test..." : "Create Test"}
              </Button>
            </CardContent>
          </Card>
        <QuestionForm/>
        </div>
        

        {/* Right Column - Questions List */}
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Available Questions</CardTitle>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Filter by difficulty:</p>
                  </div>
                  <Select
                    value={selectedDifficulty}
                    onValueChange={handleDifficultyChange}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem 
                          key={level.id} 
                          value={level.value}
                          className={level.value !== "all" ? getDifficultyColor(level.value) : ""}
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Filter by tags:</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className="rounded-full"
                      >
                        {tag}
                        {selectedTags.includes(tag) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {show && filteredQuestions?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No questions found matching the selected filters.
                </p>
              ) : (
                filteredQuestions?.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{q.slug}</h3>
                          <Badge variant="secondary" className={getDifficultyColor(q.difficulty)}>
                            {q.difficulty}
                          </Badge>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.questionTags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToTest(q)}
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div> : <div className='flex justify-center'>Not an Admin</div>}</>
   
  );
}



