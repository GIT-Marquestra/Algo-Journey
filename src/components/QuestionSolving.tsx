'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import { ExternalLink, Check, Loader2 } from 'lucide-react';
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
  "PrefixSum", "TwoPointers", "1D Arrays", "Graph", "2D Arrays", 
  "Time complexity", "Basic Maths", "Space complexity", "BinarySearch", 
  "DP", "Sorting", "Linear search", "Exponentiation", "Recursion", "String"
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
  const [cUsername, setCUsername] = useState('');
  const [lUsername, setLUsername] = useState('');
  const [score, setScore] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const colors: Record<Difficulty, string> = {
      BEGINNER: 'bg-green-500/10 text-green-500',
      EASY: 'bg-green-500/10 text-green-500',
      MEDIUM: 'bg-yellow-500/10 text-yellow-500',
      HARD: 'bg-red-500/10 text-red-500',
      VERYHARD: 'bg-red-700/10 text-red-700'
    };
    return colors[difficulty] || 'bg-gray-500/10 text-gray-500';
  };

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
        const [questionsRes, cfUsernameRes, lcUsernameRes] = await Promise.all([
          axios.post('/api/questions', topic ? { topic } : {}),
          axios.post('/api/user/codeforces/username'),
          axios.post('/api/user/leetcode/username')
        ]);

        setCUsername(cfUsernameRes.data.codeforcesUsername);
        setLUsername(lcUsernameRes.data.leetcodeUsername);
        setQuestions(questionsRes.data.questions);
        setScore(questionsRes.data.individualPoints);

        await verifyAllQuestions(
          questionsRes.data.questions,
          lcUsernameRes.data.leetcodeUsername,
          cfUsernameRes.data.codeforcesUsername
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
    <div className="container mx-auto p-4 mt-16">
      <Card className="mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="py-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Practice Questions</h2>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Filter by difficulty:</p>
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger className="w-48">
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

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Filter by tags:</p>
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
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredQuestions.map((q) => {
          const isSolved = solvedProblems.has(q.id);
          return (
            <Card 
              key={q.id}
              className={`transition-colors duration-200 ${
                isSolved ? 'bg-green-500/5 border-green-500/20' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">
                      {q.question.slug}
                    </CardTitle>
                    {isSolved && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getDifficultyColor(q.question.difficulty)} ${
                      isSolved ? 'opacity-75' : ''
                    }`}
                  >
                    {q.question.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.question.questionTags.map((tag: AnyTag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs bg-background/80"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Practice Points: {Math.floor(q.question.points / 2)}
                  </p>
                  <Link 
                    href={q.question.leetcodeUrl || q.question.codeforcesUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={isSolved ? 'opacity-75' : ''}
                    >
                      {isSolved ? 'View Problem' : 'Solve'} <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div></CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionSolving;