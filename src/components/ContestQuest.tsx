'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Timer,
  ExternalLink,
  CheckCircle,
  Check,
  Loader2,
  Trophy,
  AlertTriangle,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Difficulty } from '@prisma/client';

import { fetchLatestSubmissionsCodeForces, fetchLatestSubmissionsLeetCode } from '@/serverActions/fetch';
import axios from 'axios';
import CoordinatorContestPermissions from './CoordinatorContestPermissions';


interface Question {
  id: string;
  contestId: number;
  questionId: string;
  createdAt: Date;
  question: {
    id: string;
    leetcodeUrl: string | null;
    codeforcesUrl: string | null;
    difficulty: Difficulty;
    points: number;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
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



const ContestQuest: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [show, setShow] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const id = params.num?.[0];
  const [loadingStartTest, setloadingStartTest] = useState(false)
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [verifiedProblems, setVerifiedProblems] = useState<Set<string>>(new Set());
  const [isScoreUpdating, setIsScoreUpdating] = useState<boolean>(false);
  const [isEndingTest, setIsEndingTest] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [isCoord, setIsCoord] = useState<boolean>(false);
  const [lusername, setLUsername] = useState('')
  const [cusername, setCUsername] = useState('')
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const animateScoreUpdate = (oldScore: number, newScore: number) => {
    setIsScoreUpdating(true);
    let current = oldScore;
    const step = Math.ceil((newScore - oldScore) / 20); 
    
    const animate = () => {
      if (current < newScore) {
        current = Math.min(current + step, newScore);
        setScore(current);
        requestAnimationFrame(animate);
      } else {
        setIsScoreUpdating(false);
      }
    };
    
    requestAnimationFrame(animate);
  };
  const checkExistingSubmission = async (problemName: string) => {
    const response = await axios.post('/api/checkExistingSubmission', {
      problemName
    })

    return response.data.solved

  }

  const handleVerify = useCallback(async (
    platform: 'Leetcode' | 'Codeforces', 
    problemName: string, 
    questionId: string,
    points: number
  ): Promise<void> => {
    if (verifiedProblems.has(questionId)) {
      toast.error('Problem already verified!');
      return;
    }
    try {
      setIsVerifying({ ...isVerifying, [questionId]: true });
      if (platform === "Leetcode") {
        
        const res = await fetchLatestSubmissionsLeetCode(lusername);

        
        if (res?.recentSubmissionList) {
          let solved = res.recentSubmissionList.find(
            (p: LeetCodeSubmission) => p.titleSlug === problemName && p.statusDisplay === 'Accepted'
          );
          if(solved){
            const r = await checkExistingSubmission(problemName)
            if(r){
              solved = undefined
              toast.success('Already Attempted Question')
            } 
          }
          console.log(2)
          if (solved) {
            console.log(3)
            setVerifiedProblems(prev => new Set([...prev, questionId]));
            animateScoreUpdate(score, score + points);
            toast.success(`Problem verified! +${points} points`);
          } else {
            toast.error('No accepted submission found');
          }
        }
      } else {
        const res = await fetchLatestSubmissionsCodeForces(cusername);
        if (res) {
          let solved = res.find(
            (p: CodeForcesSubmission) => (p.problem.name === problemName && p.verdict === 'OK')

          );
          if(solved){
            const r = await checkExistingSubmission(problemName)
            if(r){
              solved = undefined
              toast.success('Already Attempted Question')
            } 
          }
          if (solved) {
            setVerifiedProblems(prev => new Set([...prev, questionId]));
            animateScoreUpdate(score, score + points);
            toast.success(`Problem verified! +${points} points`);
          } else {
            toast.error('No accepted submission found');
          }
        }
      }



    } catch (error) {
      toast.error('Error verifying submission');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying({ ...isVerifying, [questionId]: false });
    }
  }, [cusername, lusername, isVerifying, setIsVerifying, setVerifiedProblems, score, verifiedProblems]);

  const handleEndTest = useCallback(async (): Promise<void> => {
    setIsEndingTest(true);
    const loader = toast.loading('Verifying all questions...');

    try {
      for (const question of questions) {
        if (!verifiedProblems.has(question.id)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await handleVerify(
            question.question.leetcodeUrl ? 'Leetcode' : 'Codeforces',
            question.question.slug,
            question.id,
            question.question.points
          );
        }
      }


      const res = await axios.post('/api/endContest', {
        contestId: id,
        userEmail: session?.user?.email,
        finalScore: score,
        questions: Array.from(verifiedProblems)
      });

      if(res.data.status === 200) toast.success('Test ended successfully!');
      router.push('/user/dashboard');
    } catch (error) {
      toast.error('Error ending test');
      console.error('End test error:', error);
    } finally {
      setIsEndingTest(false);
      toast.dismiss(loader)
    }
  }, [handleVerify, id, questions, router, score, session?.user?.email, verifiedProblems]);


  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const resL = await axios.post('/api/user/leetcode/username')
        const resC = await axios.post('/api/user/codeforces/username')
        setCUsername(resC.data.codeforcesUsername)
        setLUsername(resL.data.leetcodeUsername)
        const coordResponse = await axios.post('/api/checkIfCoordinator')
        if(!coordResponse.data.isCoordinator) setIsCoord(false);
        setIsCoord(true);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkIfAdmin()
    
  }, []);

  

  useEffect(() => {
     
    const handleBack = () => {
      setShowModal(true);
      window.history.pushState(null, "", window.location.pathname); 
    };

    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, []);
  useEffect(() => {
    if (questions.length > 0) {
      const completedCount = verifiedProblems.size;
      const newProgress = (completedCount / questions.length) * 100;
      setProgress(newProgress);
    }
  }, [verifiedProblems, questions]);

  useEffect(() => {
    const handleUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Are you sure you want to leave? Your test progress will be lost.";
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  const confirmExit = () => {
    setShowModal(false);
    router.back();
  };


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (show && !isEndingTest) {
        e.preventDefault();
        e.returnValue = 'You have an ongoing test. Please end the test before leaving.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [show, isEndingTest]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [show, timeLeft, handleEndTest]);
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    //@ts-expect-error : it important here
    const colors: Record<Difficulty, string> = {
      EASY: 'bg-green-500/10 text-green-500',
      MEDIUM: 'bg-yellow-500/10 text-yellow-500',
      HARD: 'bg-red-500/10 text-red-500'
    };
    return colors[difficulty] || 'bg-gray-500/10 text-gray-500';
  };

  

  const handleStartTest = async (): Promise<void> => {
    try {
      if (!lusername || !cusername) {
        toast.error('Please wait while we load your profile data');
        return;
      }
      setloadingStartTest(true)
      const response = await axios.post(`/api/startContest/${id}`, 
        { user: session?.user, contestId: id },
        { 
          headers: { "Content-Type": "application/json" },
          validateStatus: (status) => status < 500 
        }
      );
      
      
      if (response.status === 200) {
        setTimeLeft(response.data.remainingTime + 30)
        
        if (response.data.questions) {
          setShow(true);
          setQuestions(response.data.questions);
        }

        toast.success('Test Started')
      }  
      else {
        const errorMessages: Record<number, string> = {
          420: 'Test Entry Closed!',
          403: 'Contest joining window has closed',
          407: 'Already attempted the test',
          440: 'Contest has not started yet!',
          430: 'User has already participated in the contest',
          404: 'To attempt Tests become member of a Group',
          490: 'You do not have permission to start the test',
          400: 'Not Authenticated, Please SignIn',
          401: 'Not Authenticated, Please SignIn'
        };
        
        toast.error(errorMessages[response.status] || "Unknown Error");
        setTimeout(() => router.push('/user/dashboard'), 2000); 
      }

    } catch (error) {
     
      console.error('Start test error:', error);
      toast.error('Server error occurred');
    } finally {
      setloadingStartTest(false)
    }
};
  return (
    <div className="min-h-screen bg-background">
      {!show ? (
        <>
        {id && isCoord && <CoordinatorContestPermissions contestId={parseInt(id)}/>}
        <div className="container mx-auto p-4 pt-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Welcome to the Contest</CardTitle>
              <CardDescription className="text-center">
                Ready to test your algorithmic skills? Click start when you&apos;re ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary/10 p-6">
                <Play className="h-12 w-12 text-primary" />
              </div>
              <Button size="lg" onClick={handleStartTest} className="w-full max-w-sm">
                {loadingStartTest ? <span>Starting...</span> : <span>Start Test</span>}
              </Button>
            </CardContent>
          </Card>
        </div>
        </>
      ) : (
        <div className="container mx-auto p-4 pt-20 space-y-6">
          <Card className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                    <span className={`text-2xl font-bold ${timeLeft < 300 ? 'text-destructive animate-pulse' : ''}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Score</p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      isScoreUpdating ? 'text-green-500' : ''
                    }`}>
                      {score}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleEndTest}
                    disabled={isEndingTest}
                  >
                    {isEndingTest ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ending Test...
                      </>
                    ) : (
                      'End Test'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {questions.map((q, index) => {
              const isVerified = verifiedProblems.has(q.id);
              return (
                <Card 
                  key={q.id}
                  className={`transition-all duration-300 ${
                    isVerified ? 'bg-green-500/5 border-green-500/20 shadow-green-500/10' : 'hover:shadow-lg'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          Question {index + 1}
                        </CardTitle>
                        <div className='flex flex-col'>
                        {/* <CardDescription>
                          {q.question.slug}
                        </CardDescription> */}
                        <CardDescription>
                          {q.question.leetcodeUrl ? 'Leetcode' : 'Codeforces'}
                        </CardDescription>
                        </div>
                        {isVerified && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Solved
                          </Badge>
                        )}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`${getDifficultyColor(q.question.difficulty)} ${
                          isVerified ? 'opacity-75' : ''
                        }`}
                      >
                        {q.question.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Points: {q.question.points}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link 
                          href={q.question.leetcodeUrl || q.question.codeforcesUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`${isVerified ? 'opacity-75' : ''} transition-all`}
                          >
                            Solve <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant={isVerified ? "ghost" : "outline"}
                          size="sm"
                          disabled={isVerified}
                          onClick={() => handleVerify(
                            q.question.leetcodeUrl ? 'Leetcode' : 'Codeforces',
                            q.question.slug,
                            q.id,
                            q.question.points
                          )}
                          className={`${isVerified ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''} transition-all`}
                        >
                          {isVerifying[q.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (isVerified) ? (
                        <>Verified <Check className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Verify <CheckCircle className="ml-2 h-4 w-4" /></>
                      )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <AlertDialog open={showModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  End Test?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave? Your progress will be saved, but you won&apos;t be able to return to this test.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowModal(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmExit} className="bg-destructive text-destructive-foreground">
                  End Test
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default ContestQuest;