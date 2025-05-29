import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Leetcode from '@/images/leetcode-svgrepo-com.svg'
import Codeforces from '@/images/codeforces-svgrepo-com.svg'
import {
  Trophy,
  Users,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Medal
} from 'lucide-react';
import { ContestStatus, SubmissionStatus, Difficulty } from '@prisma/client';
import Image from 'next/image';

// Type definitions
type QuestionTag = {
  name: string;
};

type Question = {
  id: string;
  leetcodeUrl?: string | null;
  codeforcesUrl?: string | null;
  difficulty: Difficulty;
  points: number;
  slug: string;
  questionTags: QuestionTag[];
};

type Submission = {
  id: string;
  score: number;
  status: SubmissionStatus;
  createdAt: Date;
  question: Question;
  contest?: {
    id: number;
    name: string;
    startTime: Date;
    endTime: Date;
    status: ContestStatus;
  } | null;
};

type Group = {
  id: string;
  name: string;
  groupPoints: number;
  coordinator: {
    username: string;
    email: string;
  };
};

type User = {
  id: string;
  username: string;
  email: string;
  leetcodeUsername: string;
  codeforcesUsername: string;
  section: string;
  enrollmentNum: string;
  individualPoints: number;
  profileUrl?: string | null;
  createdAt: Date;
  group?: Group | null;
  submissions: Submission[];
};

type Contest = {
  id: number;
  name: string;
  startTime: Date;
  endTime: Date;
  status: ContestStatus;
  submissions: Array<{
    id: string;
    score: number;
    status: SubmissionStatus;
    question: {
      slug: string;
      difficulty: Difficulty;
      points: number;
    };
  }>;
  groupPerformance?: {
    score: number;
    rank?: number;
  } | null;
};

type Summary = {
  totalSubmissions: number;
  totalContests: number;
  averageScore: number;
  completedQuestions: number;
  bestRank?: number;
  problemsByDifficulty: {
    BEGINNER: number;
    EASY: number;
    MEDIUM: number;
    HARD: number;
    VERYHARD: number
  };
};

type ProfileData = {
  user: User;
  contests: Contest[];
  summary: Summary;
};

type ApiResponse = {
  success: boolean;
  data?: ProfileData;
  error?: string;
};

// Utility functions



const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Profile = ({ isDarkMode = false }) => {
  const params = useParams();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

 const getStatusColor = (status: SubmissionStatus) => {
    const colors = {
      COMPLETED: isDarkMode ? 'text-green-400' : 'text-green-600',
      PENDING: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      FAILED: isDarkMode ? 'text-red-400' : 'text-red-600'
    };
    //@ts-expect-error: no need here...
    return colors[status] || (isDarkMode ? 'text-slate-400' : 'text-slate-600');
  };
  const getDifficultyColor = (difficulty: Difficulty) => {
    const colors = {
      BEGINNER: isDarkMode 
        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      EASY: isDarkMode 
        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      MEDIUM: isDarkMode 
        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
        : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      HARD: isDarkMode 
        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      VERYHARD: isDarkMode 
        ? 'bg-red-700/20 text-red-300 hover:bg-red-700/30' 
        : 'bg-red-700/10 text-red-700 hover:bg-red-700/20'
    };
    return colors[difficulty] || (isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get<ApiResponse>(`/api/getProfileDetails/${params.username}`);
        if (response.data.success && response.data.data) {
          setProfileData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load profile data');
        }
      } catch (error) {
        console.log(error)
        setError('An error occurred while fetching profile data');
      } finally {
        setLoading(false);
      }
    };

    if (params.username) {
      fetchProfile();
    }
  }, [params.username]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error || !profileData) return <div className="flex items-center justify-center min-h-screen">{error || 'Profile not found'}</div>;

  const { user, contests, summary } = profileData;

 return (
    <div className={`container mx-auto px-4 py-8 max-w-7xl ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex flex-col">
        {/* Profile Overview */}
        <Card className={`lg:col-span-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
              }`}>
                <User className={`h-8 w-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              </div>
              <div>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>{user.username}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Profile Info</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>{user.section} • {user.enrollmentNum}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Points: {user.individualPoints}</span>
                </div>
              </div>
            </div>

            {user.group && (
              <div>
                <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Group Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>{user.group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Medal className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Group Points: {user.group.groupPoints}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Coordinator: {user.group.coordinator.username}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Problem Statistics</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>Beginner</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.BEGINNER}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-green-800/30' : 'bg-green-100'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>Easy</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.EASY}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Medium</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.MEDIUM}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Hard</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.HARD}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-red-800/30' : 'bg-red-100'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Very Hard</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.VERYHARD}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Platform Links</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Image src={Leetcode} alt='leetcodeImage' className='size-4'/>
                  <Link href={`https://leetcode.com/u/${user.leetcodeUsername}/`} target='_blank'>
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{user.leetcodeUsername}</span>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                <Image src={Codeforces} alt='codeforcesImage' className='size-4'/>
                  <Link href={`https://codeforces.com/profile/${user.codeforcesUsername}`} target='_blank'>
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{user.codeforcesUsername}</span>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className='mt-2'>
          <Tabs defaultValue="submissions">
            <TabsList className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
              <TabsTrigger value="submissions" className={isDarkMode ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400' : ''}>Submissions</TabsTrigger>
              <TabsTrigger value="contests" className={isDarkMode ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400' : ''}>Contests</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4">
              {user.submissions.map((submission) => (
                <Card key={submission.id} className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className={`text-base ${isDarkMode ? 'text-white' : ''}`}>{submission.question.slug}</CardTitle>
                        <Badge variant="secondary" className={getDifficultyColor(submission.question.difficulty)}>
                          {submission.question.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.status === 'ACCEPTED' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={getStatusColor(submission.status)}>{submission.status}</span>
                      </div>
                    </div>
                    <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>
                      Score: {submission.score} • {formatDate(submission.createdAt)}
                      {submission.question.questionTags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {submission.question.questionTags.map(tag => (
                            <Badge key={tag.name} variant="outline" className={isDarkMode ? 'border-slate-600 text-slate-300' : ''}>{tag.name}</Badge>
                          ))}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="contests" className="space-y-4">
              {contests.map((contest) => (
                <Card key={contest.id} className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-base ${isDarkMode ? 'text-white' : ''}`}>{contest.name}</CardTitle>
                      <Badge variant="secondary" className={isDarkMode ? 'bg-slate-700 text-slate-300' : ''}>
                        {contest.status}
                      </Badge>
                    </div>
                    <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>
                      {formatDate(contest.startTime)} - {formatDate(contest.endTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Submissions</h4>
                        {contest.submissions.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between py-1">
                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>{sub.question.slug}</span>
                            <Badge variant="secondary" className={getDifficultyColor(sub.question.difficulty)}>
                              {sub.score}/{sub.question.points}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {contest.groupPerformance && (
                        <div>
                          <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Group Performance</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Score</span>
                              <span className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{contest.groupPerformance.score}</span>
                            </div>
                            {contest.groupPerformance.rank && (
                              <div className="flex items-center justify-between">
                                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Rank</span>
                                <span className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>#{contest.groupPerformance.rank}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};


export default Profile;