'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import { ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Difficulty } from '@prisma/client';
import { fetchLatestSubmissionsCodeForces, fetchLatestSubmissionsLeetCode } from '@/serverActions/fetch';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from './ui/skeleton';

interface Question {
  id: string;
  contestId: number;
  question: {
    id: string;
    leetcodeUrl: string | null;
    codeforcesUrl: string | null;
    difficulty: Difficulty;
    points: number;
    slug: string;
    questionTags: QuestionTag[];
  };
  submissions?: {
    status: string;
    score: number;
  }[];
}

interface AnyTag {
  id: string,
  name: string
}

interface LeetCodeSubmission {
  titleSlug: string;
  statusDisplay: string;
  timestamp: string;
}

interface CodeForcesSubmission {
  problem: {
    name: string;
  };
  verdict: string;
  creationTimeSeconds: number;
}

interface QuestionTag {
  id: string;
  name: string;
}

const AVAILABLE_TAGS = [
  "PrefixSum", "TwoPointers", "1DArrays", "Graph", "2DArrays", 
  "TimeComplexity", "BasicMaths", "SpaceComplexity", "BinarySearch", 
  "DP", "Sorting", "LinearSearch", "Exponentiation", "Recursion", "String"
];

const DIFFICULTIES = [
  { value: 'ALL', label: 'All Difficulties' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'VERYHARD', label: 'Very Hard' },
];

const QuestionSolving = () => {
  const { topic } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const [score, setScore] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);


  const verifySubmission = async (
    platform: 'Leetcode' | 'Codeforces',
    problemName: string,
    username: string
  ): Promise<boolean> => {
    try {
      if (platform === "Leetcode") {
        const res = await fetchLatestSubmissionsLeetCode(username);
        return res?.recentSubmissionList?.some(
          (p: LeetCodeSubmission) => 
            p.titleSlug === problemName && 
            p.statusDisplay === 'Accepted'
        ) || false;
      } else {
        const res = await fetchLatestSubmissionsCodeForces(username);
        return res?.some(
          (p: CodeForcesSubmission) => 
            p.problem.name === problemName && 
            p.verdict === 'OK'
        ) || false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  };

  const updateScoreInDatabase = async (questionId: string, contestId: number, points: number) => {
    try {
      const response = await axios.post('/api/updatePracticeScore', {
        questionId,
        contestId,
        score: points,
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        toast.success('Score Updated');
      }
    } catch (error) {
      console.error('Failed to update score on server:', error);
      toast.error('Score not Updated');
    }
  };

  const verifyAllQuestions = async (questions: Question[], lUsername: string, cUsername: string) => {
    const newSolvedProblems = new Set<string>();
    let totalPoints = score;

    for (const q of questions) {
      const platform = q.question.leetcodeUrl ? 'Leetcode' : 'Codeforces';
      const username = platform === 'Leetcode' ? lUsername : cUsername;
      
      const isAlreadySolved = await axios.post('/api/checkExistingSubmission', {
        problemName: q.question.slug
      });

      if (isAlreadySolved.data.solved) {
        newSolvedProblems.add(q.id);
        continue;
      }

      const isSolved = await verifySubmission(
        platform,
        q.question.slug,
        username
      );

      if (isSolved) {
        newSolvedProblems.add(q.id);
        const points = Math.floor(q.question.points / 2);
        totalPoints += points;
        await updateScoreInDatabase(q.question.id, q.contestId, points);
      }
    }

    setSolvedProblems(newSolvedProblems);
    setScore(totalPoints);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [questionsRes, response] = await Promise.all([
          axios.post('/api/questions', topic ? { topic } : {}),
          axios.post('/api/user/username')
        ]);

        setQuestions(questionsRes.data.questions);
        setScore(questionsRes.data.individualPoints);

        await verifyAllQuestions(
          questionsRes.data.questions,
          response.data.leetcodeUsername,
          response.data.codeforcesUsername
        );
      } catch (error) {
        console.error(error);
        toast.error('Error fetching questions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topic]);

  useEffect(() => {
    let filtered = questions;
    
    if (selectedDifficulty !== 'ALL') {
      filtered = filtered.filter(q => q.question.difficulty === selectedDifficulty);
    }
   
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => {
        const questionTagNames = q.question.questionTags.map(tag => tag.name);
        return selectedTags.some(selectedTag => questionTagNames.includes(selectedTag));
      });
    }

    setFilteredQuestions(filtered);
  }, [selectedTags, selectedDifficulty, questions]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 mt-16">
        <Card className="mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardContent className="py-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-48" />
              <div className="text-right">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className="h-5 w-16" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 mt-16 max-w-6xl">
      <Card className="mb-6 bg-indigo-50/90 border border-indigo-100 shadow-sm">
        <CardContent className="py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-indigo-800">Practice Questions</h2>
              <p className="text-sm text-indigo-600 mt-1">Master algorithms through consistent practice</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
              <p className="text-sm text-gray-600 mb-1">Total Score</p>
              <p className="text-3xl font-bold text-indigo-700">{score}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <p className="text-sm font-medium text-gray-700">Filter by difficulty:</p>
                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger className="w-full md:w-48 bg-white border-indigo-200 text-indigo-700">
                    <SelectValue placeholder="Select Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(difficulty => (
                      <SelectItem key={difficulty.value} value={difficulty.value}>
                        {difficulty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
  
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Filter by tags:</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full text-xs px-3 py-1 h-auto ${
                        selectedTags.includes(tag) 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm">
          <p className="text-gray-600">No questions match your current filters.</p>
          <Button 
            variant="outline"
            className="mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50" 
            onClick={() => {
              setSelectedTags([]);
              setSelectedDifficulty("ALL");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredQuestions.map((q) => {
            const isSolved = solvedProblems.has(q.id);
            
            // Get difficulty color
            let difficultyColor = "";
            switch (q.question.difficulty) {
              case "BEGINNER":
              case "EASY":
                difficultyColor = "bg-green-500/10 text-green-700 border-green-200";
                break;
              case "MEDIUM":
                difficultyColor = "bg-amber-500/10 text-amber-700 border-amber-200";
                break;
              case "HARD":
              case "VERYHARD":
                difficultyColor = "bg-red-500/10 text-red-700 border-red-200";
                break;
              default:
                difficultyColor = "bg-gray-500/10 text-gray-700 border-gray-200";
            }
            
            return (
              <Card 
                key={q.id}
                className={`transition-all duration-300 hover:shadow-md ${
                  isSolved 
                    ? 'bg-green-50/50 border-green-200' 
                    : 'bg-white border-gray-100 hover:border-indigo-200'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className={`text-xl ${isSolved ? 'text-green-800' : 'text-indigo-800'}`}>
                        {q.question.slug}
                      </CardTitle>
                      {isSolved && (
                        <div className="flex items-center gap-1">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Solved</span>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${difficultyColor} ${
                        isSolved ? 'opacity-75' : ''
                      } px-3 py-1 rounded-full text-xs font-medium`}
                    >
                      {q.question.difficulty}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {q.question.questionTags.map((tag: AnyTag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={`text-xs bg-white border-gray-200 text-gray-600 ${
                          selectedTags.includes(tag.name) 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : ''
                        }`}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isSolved ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        <span className="text-sm font-bold">{Math.floor(q.question.points / 2)}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Practice Points
                      </p>
                    </div>
                    <Link 
                      href={q.question.leetcodeUrl || q.question.codeforcesUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button 
                        variant={isSolved ? "outline" : "default"}
                        size="sm"
                        className={`w-full ${
                          isSolved 
                            ? 'border-green-200 text-green-700 hover:bg-green-50' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isSolved ? 'View Problem' : 'Solve Now'} 
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {questions.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>
      )}
    </div>
  )}
export default QuestionSolving;