'use client'
import React, { JSX, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Users, 
  Target, 
  ChevronRight, 
  Award, 
  Clock, 
  ChevronDown, 
  Calendar, 
  Timer, 
  Check, 
  AlertTriangle,
  Code,
  Activity,
  ExternalLink,
  ArrowUpRight,
  Crown,
  Settings,
  UsersIcon,
  Plus,
  ArrowRight,
} from "lucide-react"
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { cn } from "@/lib/utils"
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { fetchCodeforcesUserData, fetchUserStats } from '@/serverActions/fetch';
import { useQuery } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/DashboardLoader';
import ProjectRatingNotification from '@/components/Notification';

// Interfaces (same as before)
interface GroupMember {
  username: string;
  individualPoints: number;
}

interface Group {
  name: string;
  groupPoints: number;
  _count: {
    members: number;  
  }
}

interface User {
  individualPoints: number;
  group?: Group;
  coordinatedGroup?: Group;
}

interface UserStats {
  totalSubmissions: number;
  totalPoints: number;
  groupName: string | null;
  groupPoints: number | null;
  groupMembers: number | null;
  isCoordinator: boolean;
}

interface Contest {
  id: number;
  startTime: string;
  name: string
  duration: string;
  endTime: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
}

interface DashboardData {
  contests: Contest[];
  username: string;
  isAdmin: boolean;
  userStats: UserStats;
}

interface LeetCodeStats {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  leetcodeUsername: string;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
}

interface CodeForcesStats {
  codeforcesUsername: string; 
  rating: number;
}

interface PlatformData {
  leetcodeData: LeetCodeStats | null;
  codeforcesData: CodeForcesStats | null;
}

// Fetch functions (same as before)
const fetchDashboardData = async (): Promise<DashboardData> => {
  const contestsResponse = await axios.get<{
    latestContests: Contest[];
    submissionCount: number;
    user: User;
  }>('/api/getData');
  
  const usernameResponse = await axios.post<{
    username: string;
  }>('/api/getUsername');
  
  const adminResponse = await axios.post<{
    isAdmin: boolean;
  }>('/api/checkIfAdmin');


  return {
    contests: contestsResponse.data.latestContests,
    username: usernameResponse.data.username,
    isAdmin: adminResponse.data.isAdmin,
    userStats: {
      totalSubmissions: contestsResponse.data.submissionCount,
      totalPoints: contestsResponse.data.user.individualPoints,
      groupName: contestsResponse.data.user.group?.name || null,
      groupPoints: contestsResponse.data.user.group?.groupPoints || null,
      groupMembers: contestsResponse.data.user?.group?._count?.members || null,
      isCoordinator: contestsResponse.data.user?.coordinatedGroup ? true : false
    }
  };
};

const fetchPlatformData = async (): Promise<PlatformData> => {
  const usernames = await axios.post<{
    leetcodeUsername: string | null;
    codeforcesUsername: string | null;  
  }>('/api/user/username');

  if (!usernames.data.leetcodeUsername || !usernames.data.codeforcesUsername) {
    throw new Error('Usernames not set');
  }

  const [leetcodeData, codeforcesData] = await Promise.all([
    fetchUserStats(usernames.data.leetcodeUsername) as Promise<LeetCodeStats>,
    fetchCodeforcesUserData(usernames.data.codeforcesUsername),
  ]);

  return {
    leetcodeData: leetcodeData,
    codeforcesData: codeforcesData || null
  };
};
type StatusType = "ACTIVE" | "INACTIVE" | "COMPLETED";
const StatusBadge = ({ status }: { status: StatusType }) => {
  const statusConfig: Record<StatusType, { color: string; icon: JSX.Element }> = {
    ACTIVE: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <Check className="h-3 w-3 mr-1" />,
    },
    INACTIVE: {
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    COMPLETED: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <AlertTriangle className="h-3 w-3 mr-1" />,
    },
  };

  const config = statusConfig[status] || statusConfig.INACTIVE;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};


export default function Dashboard() {
  const [members, setMembers] = useState<GroupMember[]>([]);  
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false); 
  const router = useRouter();
  const { data: session, status } = useSession();
  const [notification, setNotification] = useState<boolean>(true);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [token, setToken] = useState<string | null>(null)

  const { 
    data: dashboardData,
    isLoading: isDashboardLoading,
  } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    enabled: !!session?.user?.email,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: platformData,
    isLoading: isPlatformLoading,
  } = useQuery({
    queryKey: ['platformData'],
    queryFn: () => fetchPlatformData().catch((error) => {
      if (error.message === 'Usernames not set') {
        toast.error('Please set your leetcode and codeforces usernames in settings');
      }
      throw error;
    }),
    enabled: !!session?.user?.email,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  const isLoading = isDashboardLoading || isPlatformLoading;

  // Calculate difficulty percentages for LeetCode
  const getLeetCodeDifficultyPercentage = (solved: number, total: number) => {
    return solved && total ? Math.round((solved / total) * 100) : 0;
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    //@ts-expect-error: don't know about this 
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('githubAccessToken');
    if (accessToken) {
      setToken(accessToken);
    }
  }, []);

  // Format time function
  const formatTime = (timeString: string) => {
    const time = timeString.split('T')[1].split('.000Z')[0];
    return time;
  };


  return (
    <div className="min-h-screen bg-gray-50">
  <div className="container mx-auto p-8 pt-20 space-y-8">
    {isLoading ? <DashboardSkeleton/> : (
    <>
      {/* Welcome header with avatar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, <span className="text-indigo-600">{dashboardData?.username}</span>
          </h1>
          <p className="text-gray-600 mt-1">Let&apos;s continue your coding journey!</p>
        </div>
        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
          {dashboardData?.username?.charAt(0)?.toUpperCase() || "U"}
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-800">{dashboardData?.userStats.totalSubmissions}</p>
            <p className="text-xs text-gray-500 mt-1">Total problems attempted</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-teal-400 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-teal-500" />
              Individual Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-800">{dashboardData?.userStats.totalPoints}</p>
            <p className="text-xs text-gray-500 mt-1">Your personal points</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-800 truncate">
              {dashboardData?.userStats.groupName || 'No Team'}
            </p>
            {dashboardData?.userStats.groupName && (
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.userStats.groupMembers} team members
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-rose-400 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Award className="h-4 w-4 text-rose-500" />
              Team Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-800">
              {dashboardData?.userStats.groupPoints || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Combined team points</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* LeetCode card */}
        <Card className="bg-white/90 shadow-sm hover:shadow-md transition-all border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-500" />
                LeetCode Progress
              </CardTitle>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </div>
            <CardDescription className="text-gray-500">
              Track your problem-solving journey
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Problems Solved
                </span>
                <span className="text-lg font-bold text-gray-800">
                  {platformData?.leetcodeData?.totalSolved || 0} / {platformData?.leetcodeData?.totalQuestions || 0}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                {platformData?.leetcodeData && <div 
                  className="bg-indigo-500 h-2.5 rounded-full" 
                  style={{ width: `${(platformData?.leetcodeData?.totalSolved / platformData?.leetcodeData?.totalQuestions * 100) || 0}%` }}
                ></div>}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-700">Easy</div>
                  <div className="text-lg font-semibold text-green-800">
                    {platformData?.leetcodeData?.easySolved || 0} 
                    <span className="text-xs text-green-600">/{platformData?.leetcodeData?.totalEasy || 0}</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
                    {platformData?.leetcodeData && <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${getLeetCodeDifficultyPercentage(platformData?.leetcodeData?.easySolved, platformData?.leetcodeData?.totalEasy)}%` }}
                    ></div>}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="text-xs text-amber-700">Medium</div>
                  <div className="text-lg font-semibold text-amber-800">
                    {platformData?.leetcodeData?.mediumSolved || 0}
                    <span className="text-xs text-amber-600">/{platformData?.leetcodeData?.totalMedium || 0}</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1">
                    {platformData?.leetcodeData && <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: `${getLeetCodeDifficultyPercentage(platformData?.leetcodeData?.mediumSolved, platformData?.leetcodeData?.totalMedium)}%` }}
                    ></div>}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-xs text-red-700">Hard</div>
                  <div className="text-lg font-semibold text-red-800">
                    {platformData?.leetcodeData?.hardSolved || 0}
                    <span className="text-xs text-red-600">/{platformData?.leetcodeData?.totalHard || 0}</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-1.5 mt-1">
                    {platformData?.leetcodeData && <div 
                      className="bg-red-500 h-1.5 rounded-full" 
                      style={{ width: `${getLeetCodeDifficultyPercentage(platformData?.leetcodeData?.hardSolved, platformData?.leetcodeData?.totalHard)}%` }}
                    ></div>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Global Rank:</span> #{platformData?.leetcodeData?.ranking || 'N/A'}
              </div>
              <Link href={`https://leetcode.com/u/${platformData?.leetcodeData?.leetcodeUsername}/`} target='_blank'>
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-indigo-50 text-indigo-600">
                View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Codeforces card */}
        <Card className="bg-white/90 shadow-sm hover:shadow-md transition-all border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-500" />
                Codeforces Rating
              </CardTitle>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </div>
            <CardDescription className="text-gray-500">
              Track your competitive programming progress
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center p-6">
              <div className="relative w-32 h-32 rounded-full flex items-center justify-center mb-4">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="46" 
                    fill="none" 
                    stroke="rgb(20, 184, 166)" 
                    strokeWidth="8" 
                    strokeDasharray="289.27"
                    strokeDashoffset={(289.27 * (1 - Math.min((platformData?.codeforcesData?.rating || 0) / 2000, 1)))}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                {/* Rating value */}
                <div className="text-3xl font-bold text-gray-800">
                  {platformData?.codeforcesData?.rating || 0}
                </div>
              </div>

              <div className="text-sm text-center text-gray-600 mt-2">
                Keep practicing to improve your rating!
              </div>

              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-6">
                <div 
                  className="bg-teal-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min((platformData?.codeforcesData?.rating || 0) / 20, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between w-full text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>500</span>
                <span>1000</span>
                <span>1500</span>
                <span>2000+</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-100 pt-4">
          <Link href={`https://codeforces.com/profile/${platformData?.codeforcesData?.codeforcesUsername}`} target='_blank'>
            <Button variant="outline" size="sm" className="ml-auto border-gray-200 hover:bg-teal-50 text-teal-600">
              View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Latest Contests */}
      <Card className="bg-white/90 shadow-sm hover:shadow-md transition-all border-gray-100">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-500" />
                Latest Contests
              </CardTitle>
              <CardDescription className="text-gray-500">
                Ready for your next challenge?
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" className="border-gray-200 hover:bg-gray-50">
              <Clock className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {dashboardData?.contests.map((contest) => (
              <div key={contest.id} className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      #{contest.id}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{contest.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        {formatDate(contest.startTime)}
                        <span className="mx-1">•</span>
                        <Timer className="h-3 w-3" /> 
                        {formatTime(contest.startTime)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={contest.status} />
                </div>
                <div className="px-4 py-3 bg-white flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">Duration</p>
                      <p className="text-sm font-medium text-blue-800">{contest.duration} min</p>
                    </div>
                    {contest.status === 'COMPLETED' && (
                      <div className="px-3 py-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600">Completed</p>
                        <p className="text-sm font-medium text-green-800"><Check className='size-5'/></p>
                      </div>
                    )}
                  </div>
                  
                  {contest.status === 'ACTIVE' && (
                    <Button 
                      className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all"
                      onClick={() => router.push(`/contest/${contest.id}`)}
                    >
                      Start Contest <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                  {contest.status === 'COMPLETED' && (
                    <Button 
                      variant="outline"
                      className="border-gray-200 hover:bg-indigo-50 text-indigo-600"
                      onClick={() => router.push(`/contestsPage`)}
                    >
                      View Results <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                  {contest.status === 'INACTIVE' && (
                    <Button 
                      variant="outline"
                      className="border-gray-200 hover:bg-gray-50 text-gray-600 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      Coming Soon <Clock className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      {dashboardData?.userStats.groupName ? (
        <Card className="bg-white/90 shadow-sm hover:shadow-md transition-all border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  Team: {dashboardData.userStats.groupName}
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Team score: {dashboardData.userStats.groupPoints} points
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                className="p-0 hover:bg-transparent"
                onClick={async () => {
                  try{
                    setLoadingMembers(true)
                    const response = await axios.get('/api/getGroupMembersForMember');
                    if(response.status !== 200){{
                      toast.error('Error fethcing members')
                    }}
                    setMembers(response.data.members);  
                    setShowTeamMembers(!showTeamMembers)

                  } catch (error){
                    console.error('Error fetching team members:', error);
                    toast.error('Failed to fetch team members');
                  } finally {
                    setShowTeamMembers(!showTeamMembers);
                    setLoadingMembers(false)
                  }
                }}
              >
                <ChevronDown className={`h-5 w-5 text-gray-600 transition-transform ${showTeamMembers ? 'transform rotate-180' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          {loadingMembers ? (<CardContent className="pt-4">
      <div className="overflow-hidden rounded-lg border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="text-gray-700">Rank</TableHead>
              <TableHead className="text-gray-700">Member</TableHead>
              <TableHead className="text-right text-gray-700">Points</TableHead>
              <TableHead className="text-right text-gray-700">Contribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="border-b border-gray-50 animate-pulse">
                <TableCell className="py-3 text-center">
                  <div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div>
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-4 w-8 bg-gray-200 rounded"></div>
                    <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gray-300 h-1.5 rounded-full w-1/2"></div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>) : showTeamMembers && (
            <CardContent className="pt-4">
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-100">
                      <TableHead className="text-gray-700">Rank</TableHead>
                      <TableHead className="text-gray-700">Member</TableHead>
                      <TableHead className="text-right text-gray-700">Points</TableHead>
                      <TableHead className="text-right text-gray-700">Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members
                      .sort((a, b) => b.individualPoints - a.individualPoints)
                      .map((member, index) => {
                        const totalPoints = dashboardData.userStats.groupPoints || 1;
                        const contribution = Math.round((member.individualPoints / totalPoints) * 100);
                        
                        return (
                          <TableRow 
                            key={member.username} 
                            className={cn(
                              "border-b border-gray-50",
                              member.username === dashboardData.username ? "bg-amber-50" : ""
                            )}
                          >
                            <TableCell className="py-3 text-center">
                              <div className="flex justify-center items-center">
                                {index === 0 ? (
                                  <Crown className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <span className="font-medium text-gray-700">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
                                  {member.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">{member.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-right font-medium text-gray-700">
                              {member.individualPoints}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-medium text-gray-700">{contribution}%</span>
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div 
                                    className="bg-amber-500 h-1.5 rounded-full" 
                                    style={{ width: `${contribution}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
          <CardFooter className="border-t border-gray-100 pt-4 flex justify-between">
            <Button onClick={() => {
              router.push('/groupCreation')
            }} variant="outline" size="sm" className="border-gray-200 hover:bg-amber-50 text-amber-600">
              Team Settings <Settings className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="bg-white/90 shadow-sm hover:shadow-md transition-all border-gray-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Join a Team
            </CardTitle>
            <CardDescription className="text-gray-500">
              Teams can earn more points and unlock special challenges
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-center p-8">
            <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="h-12 w-12 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Collaborate with others</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Join a team to collaborate with other developers, participate in team challenges, and climb the leaderboard together.
            </p>
            <div className="flex gap-4">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Create Team <Plus className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-gray-200 hover:bg-blue-50 text-blue-600">
                Join Existing Team <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
    )}
  </div>
  {notification && <ProjectRatingNotification onGetRated={() => {
    router.push(token ? '/chat/true' : '/chat/false')
  }} onClose={() => {
    setNotification(false)
  }}/>}
</div> );
}