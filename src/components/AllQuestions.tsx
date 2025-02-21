'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Leetcode from '@/images/leetcode-svgrepo-com.svg'
import Codeforces from '@/images/codeforces-svgrepo-com.svg'
import { Clock, Filter, Plus, Trash2, X } from 'lucide-react';
import { 
  Swords, 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionForm from './QuestionsInput';
import UpdateContestCard from './UpdateContest';
import Link from 'next/link';
import ContestPermissionModal from './ContestPermissionModal';
import Image from 'next/image';

const AVAILABLE_TAGS = [
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
];

const DIFFICULTY_LEVELS = [
  { id: "all", value: "all", label: "All Difficulties" },
  { id: "beginner", value: "BEGINNER", label: "Beginner" },
  { id: "easy", value: "EASY", label: "Easy" },
  { id: "medium", value: "MEDIUM", label: "Medium" },
  { id: "hard", value: "HARD", label: "Hard" },
  { id: "veryhard", value: "VERYHARD", label: "Very Hard" }
];
type Difficulty = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERYHARD';
interface Question1 {
  id: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  questionTags: QuestionTag[];
  slug: string;
  difficulty: Difficulty
}

interface QuestionTag {
  id: string;
  name: string;
}
interface QuestionOnContest {
  id: string;
  leetcodeUrl: string;
  contestAppearances: number[]
  contests: { contestId: number | null }[]
  codeforcesUrl: string;
  questionTags: { id: string; name: string; }[];
  slug: string;
  difficulty: string;
}

export default function AllQuestions() {
  const [questions, setQuestions] = useState<Question1[]>([]);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question1[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [filteredQuestions, setFilteredQuestions] = useState<Question1[]>([]);
  const [duration, setDuration] = useState(120);
  const [contestName, setContestName] = useState("");
  const [questionOnContest, setQuestionOnContest] = useState<QuestionOnContest[]>([])
  const [loadingArena, setLoadingArena] = useState(false)
  const [selectedArenaQuestions, setSelectedArenaQuestions] = useState<Question1[]>([])
  const [show, setShow] = useState(true)


  const fetchQuestions = useCallback(async () => {
    try {
      const res = await axios.post('/api/checkIfAdmin')
      const response = await axios.post<{ questions: Question1[] }>("/api/getQuestions");
      const response2 = await axios.post('/api/getQuestionOnContest')
      if(!(response2.status === 200)) {
        toast.error(response2.data.message)
      }
      setQuestionOnContest(response2.data.data)
      if(!res.data.isAdmin) {
        setShow(false)
        return
      } 
      if(res.data.isAdmin) setShow(true)
      
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

  const addToTest = (question: Question1) => {
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

  const addToArena = (question: Question1) => {
    if (selectedArenaQuestions?.some(q => q.id === question.id)) {
      toast.error("Question already added to Arena");
      return;
    }
    setSelectedArenaQuestions(prev => [...prev, { ...question }]);
    toast.success("Question added to Arena");
  };

  const removeFromArena = (questionId: string) => {
    setSelectedArenaQuestions(prev => prev.filter(q => q.id !== questionId));
    toast.success("Question removed from Arena");
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

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDuration(isNaN(value) ? 1 : Math.max(1, value)); // Ensure duration is at least 1 hour
};

const handleCreateTest = async () => {
  if (selectedQuestions.length === 0) {
    toast.error("Please select at least one question to create a test.");
    return 0;
  }

  if (!validateDates()) {
    return 0;
  }

  setLoading(true);
  try {
    console.log('creating test')
    const testData = {
      questions: selectedQuestions,
      name: contestName,
      startTime: formatDateForPrisma(startTime),
      duration,
      endTime: formatDateForPrisma(endTime)
    };


    const response = await axios.post("/api/createTest", testData);
    console.log(response.data)  
    const contestId = response.data.contestId; // Make sure your API returns the contest ID
    
    return contestId;
  } catch (error) {
    console.error("Error creating test:", error);
    toast.error("Failed to create test.");
    return 0;
  } finally {
    setLoading(false);
  }
};

const confirm = (id: string) => {
  //@ts-expect-error: it is important here , that's it 
  toast((t) => (
    <div className="flex flex-col">
      <p className="font-semibold">Are you sure?</p>
      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => {
            toast.dismiss(t.id);
            handleDeleteQuestion(id);
          }} 
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Yes
        </button>
        <button 
          onClick={() => toast.dismiss(t.id)} 
          className="bg-gray-300 px-3 py-1 rounded"
        >
          No
        </button>
      </div>
    </div>
  ), { duration: 5000 }); // Auto-dismiss after 5 sec
};

// const handleEdit = (id: string) => {

// }

const handlePushToArena = async () => {
  if (selectedArenaQuestions.length === 0) {
    toast.error("Please select at least one question to add to arena.");
  }

  setLoadingArena(true);
  try {
    const response = await axios.post("/api/pushToArena", { questions: selectedArenaQuestions });
    console.log(response.data)  
    if(!(response.status === 200)) {
      toast.error(response.data.message)
      return 
    }
    toast.success("Pushed Successfully")
  } catch (error) {
    console.error("Error adding to arena:", error);
    toast.error("Failed to add to arena.");
  } finally {
    setLoadingArena(false);
  }
};

const handleDeleteQuestion = async (id: string) => {
  try {
    const response = await axios.post('/api/deleteQuestion', { questionId: id })
    if(!(response.status === 200)) {
      toast.error(response.data.message)
      return 
    }

    toast.success("Deleted")
  } catch (error) {
    console.log('Error while deleteing question: ', error)
    toast.error("Some unexpected error occured!")
  }
}

  return (
    <>
    
    {show ? <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Test Creation */}
        <div className="w-full md:w-1/3 space-y-6">
        <UpdateContestCard dbQuestions={questions}/>
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Test Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  type="text"
                  value={contestName}
                  placeholder='Enter Contest Name'
                  onChange={(e) => setContestName(e.target.value)}
                />
              </div>
              <div>
                  <label className="block mb-1">Contest Duration (minutes)</label>
                  <input
                      type="number"
                      value={duration}
                      onChange={handleDurationChange}
                      className="w-full p-2 border border-gray-600 rounded-md text-black"
                  />
              </div>
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
                    <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                      <span className="font-medium text-blue-700">{q.slug}</span>
                    </Link>
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
                onClick={() => setIsPermissionModalOpen(true)}
                disabled={loading}
              >
                {loading ? "Creating Test..." : "Create Test"}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Questions to push to Arena</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {show && selectedArenaQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions selected.</p>
              ) : (
                selectedArenaQuestions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                      <span className="font-medium text-blue-700">{q.slug}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromArena(q.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              <Button
                className="w-full mt-4"
                disabled={loadingArena}
                onClick={handlePushToArena}   
              >
                {loadingArena ? "Pushing..." : "Push to Arena"}
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
                  <Card key={q.id} className='relative'>
                    <Trash2 className='absolute right-1 mx-1 top-2 text-red-500' onClick={()=>confirm(q.id)}/>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 flex">
                          <div>
                            <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                              <h3 className="font-semibold text-blue-700">{q.slug}</h3>
                            </Link>
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
                            <div className='flex flex-col'>
                            <span className='p-3 absolute top-1'>{(questionOnContest.filter((p) => p.id === q.id)[0].contests.length !== 0 && !questionOnContest.filter((p) => p.id === q.id)[0].contests[0].contestId) && <Swords/>}</span>
                            <Image src={q.leetcodeUrl ? Leetcode : Codeforces} alt='logo' className='size-6 mx-10 absolute top-4'/>
                            {/* <span className='p-3 absolute top-8'>{!(questionOnContest.filter((p) => p.id === q.id)[0].contestAppearances.length === 1 && questionOnContest.filter((p) => p.id === q.id)[0].contestAppearances[0] === null) && <LucideSword/> }</span> */}
                            {/* <span className='p-3 absolute bottom-1 font-bold text-[15px]'>Contest {questionOnContest.filter((p) => p.contestAppearances && p.id === q.id) ? questionOnContest.filter((p) => p.contestAppearances && p.id === q.id)[0].contestAppearances.map((m) => <span className='font-bold text-[15px]'>{m}</span>): '-'}</span> */}
                            </div>
                        </div>
                        <div className='flex flex-col p-3 mr-2'>
                        <Button
                          size="sm"
                          onClick={() => addToTest(q)}
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Test
                        </Button>
                        <Button
                          size="sm"
                          variant='outline'
                          className="shrink-0 mt-4"
                          onClick={() => addToArena(q)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to arena
                        </Button>
                        </div>
                      </div>
                      
                    </CardContent>
                    
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ContestPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onCreateTest={handleCreateTest}
      />
      </div> : <div className='flex justify-center'>Not an Admin</div>}</>
   
  );
}



