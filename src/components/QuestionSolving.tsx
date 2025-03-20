'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import { ExternalLink, Check, Loader2, CheckCircle } from 'lucide-react';
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
import useStore from '@/store/store';
import { HintsComponent } from './Modals/Hints';

interface Question {
  id: string;
  contestId: number;
  slug: string;
  difficulty: Difficulty;
  points: number;
  isSolved: boolean;
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  questionTags: QuestionTag[];
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
  "String",
  "HashMaps/Dictionary"
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
  const { array } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const { pUsernames, setPUsernames } = useStore()
  const [selectSolved, setSelectSolved] = useState<boolean>(false); 
  const [score, setScore] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const newString = Array.isArray(array) ? array.join('/') : null;
  const newArray = newString ? newString.split('/s/') : null;
  const topics = newArray ? newArray[0].split('/') : null;
  const difficulties = newArray ? newArray[1].split('/') : null;
  const [isVerifying, setIsVerifying] = useState<{ [key: string]: boolean }>({}); 


  const verifySubmission = async (
    platform: 'Leetcode' | 'Codeforces',
    problemName: string,
    username: string,
    questionId: string
  ): Promise<boolean> => {
    setIsVerifying(prev => ({ ...prev, [questionId]: true }));
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
    } finally{
      setIsVerifying(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const updateScoreInDatabase = async (questionId: string, contestId: number | null, points: number) => {
    try {
      const response = await axios.post('/api/updatePracticeScore', {
        questionId,
        contestId,
        score: points,
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        solvedProblems.add(questionId);
        setSolvedProblems(new Set(solvedProblems));
        setScore(prev => prev + points);
        toast.success('Score Updated');
      }
    } catch (error) {
      console.error('Failed to update score on server:', error);
      toast.error('Score not Updated');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if(pUsernames.codeforcesUsername === "" || pUsernames.leetcodeUsername === ""){
          const usernames = await axios.post<{
            leetcodeUsername: string | null;
            codeforcesUsername: string | null;  
          }>('/api/user/username');
        
          setPUsernames({
            leetcodeUsername: usernames.data.leetcodeUsername || '',
            codeforcesUsername: usernames.data.codeforcesUsername || ''
          });
        }

        const questionsRes = await axios.post('/api/questions', topics && difficulties ? { topics: [...topics], difficulties: [...difficulties] } : {})
 
        setQuestions(questionsRes.data.questionsWithSolvedStatus);
        setScore(questionsRes.data.individualPoints);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching questions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = questions;

    if(selectSolved){
      filtered = filtered.filter(q => !q.isSolved && !solvedProblems.has(q.id));
    }

    if (selectedDifficulty !== 'ALL') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
   
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => {
        const questionTagNames = q.questionTags.map(tag => tag.name);
        return selectedTags.some(selectedTag => questionTagNames.includes(selectedTag));
      });
    }

    setFilteredQuestions(filtered);
  }, [selectedTags, selectedDifficulty, questions, setSelectSolved, selectSolved]);

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
                <Button className='bg-indigo-600 hover:bg-indigo-500' onClick={() => setSelectSolved((p) => !p)}>Toggle not Solved</Button>
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
            
            // Get difficulty color
            let difficultyColor = "";
            switch (q.difficulty) {
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
    q.isSolved || solvedProblems.has(q.id) 
      ? 'bg-green-50/50 border-green-200' 
      : 'bg-white border-gray-100 hover:border-indigo-200'
  }`}
>
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CardTitle className={`text-xl ${q.isSolved ? 'text-green-800' : 'text-indigo-800'}`}>
          {q.slug}
        </CardTitle>
        {q.isSolved || solvedProblems.has(q.id) || solvedProblems.has(q.id) && (
          <div className="flex items-center gap-1">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-green-600">Solved</span>
          </div>
        )}
      </div>
      <Badge 
        variant="secondary" 
        className={`${difficultyColor} ${
          q.isSolved || solvedProblems.has(q.id) ? 'opacity-75' : ''
        } px-3 py-1 rounded-full text-xs font-medium`}
      >
        {q.difficulty}
      </Badge>
    </div>
    <div className="flex flex-wrap gap-2 mt-3">
      {q.questionTags.map((tag: AnyTag) => (
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
          q.isSolved || solvedProblems.has(q.id) ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
        }`}>
          <span className="text-sm font-bold">{Math.floor(q.points / 2)}</span>
        </div>
        <p className="text-sm text-gray-600">
          Practice Points
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <HintsComponent questionId={q.id} questionSlug={q.slug} />
        
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            if(q.isSolved || solvedProblems.has(q.id)){
              toast.error('Already verified');
              return;
            }
            const response = await verifySubmission(q.leetcodeUrl ? 'Leetcode' : 'Codeforces', q.slug, q.leetcodeUrl ? pUsernames.leetcodeUsername : pUsernames.codeforcesUsername, q.id); 
            if(response){
              updateScoreInDatabase(q.id, null, q.points);  
            } else {
              toast.error('Submission not verified');
            }
          }}
          disabled={isVerifying[q.id]}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto"
        >
          {isVerifying[q.id] ? 
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          : q.isSolved || solvedProblems.has(q.id) ? 
            <>Verified <CheckCircle className="ml-2 h-4 w-4 text-green-400" /></>
           : <>Verify <CheckCircle className="ml-2 h-4 w-4" /></>}
        </Button>
        
        <Link 
          href={q.leetcodeUrl || q.codeforcesUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button 
            variant={q.isSolved ? "outline" : "default"}
            size="sm"
            className={`w-full ${
              q.isSolved || solvedProblems.has(q.id) 
                ? 'border-green-200 text-green-700 hover:bg-green-50' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {q.isSolved || solvedProblems.has(q.id) ? 'View Problem' : 'Solve Now'} 
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
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