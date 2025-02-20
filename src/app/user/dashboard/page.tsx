'use client'
import React, { JSX, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Trophy, Users, Target, ChevronRight, Award, Clock } from "lucide-react"
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { cn } from "@/lib/utils"
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { fetchCodeforcesUserData, fetchUserStats } from '@/serverActions/fetch';
import { useQuery } from '@tanstack/react-query';

interface GroupMember {
  username: string;
  individualPoints: number;
}

interface Group {
  name: string;
  groupPoints: number;
  members: GroupMember[];
}

interface User {
  individualPoints: number;
  group?: Group;
}

interface UserStats {
  totalSubmissions: number;
  totalPoints: number;
  groupName: string | null;
  groupPoints: number | null;
  groupMembers: GroupMember[];
}

interface Contest {
  id: number;
  startTime: string;
  name: string
  endTime: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
}

interface DashboardData {
  contests: Contest[];
  isCoordinator: boolean;
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
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
}

interface PlatformData {
  leetcodeData: LeetCodeStats | null;
  codeforcesRating: number | null;
}

const calculateDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};



const fetchDashboardData = async (): Promise<DashboardData> => {
  const contestsResponse = await axios.get<{
    latestContests: Contest[];
    submissionCount: number;
    user: User;
  }>('/api/getData');
  
  const coordResponse = await axios.post<{
    isCoordinator: boolean;
  }>('/api/checkIfCoordinator');
  
  const usernameResponse = await axios.post<{
    username: string;
  }>('/api/getUsername');
  
  const adminResponse = await axios.post<{
    isAdmin: boolean;
  }>('/api/checkIfAdmin');

  return {
    contests: contestsResponse.data.latestContests,
    isCoordinator: coordResponse.data.isCoordinator,
    username: usernameResponse.data.username,
    isAdmin: adminResponse.data.isAdmin,
    userStats: {
      totalSubmissions: contestsResponse.data.submissionCount,
      totalPoints: contestsResponse.data.user.individualPoints,
      groupName: contestsResponse.data.user.group?.name || null,
      groupPoints: contestsResponse.data.user.group?.groupPoints || null,
      groupMembers: contestsResponse.data.user.group?.members || []
    }
  };
};

const fetchPlatformData = async (): Promise<PlatformData> => {
  const leetcodeResponse = await axios.post<{
    leetcodeUsername: string | null;
  }>('/api/user/leetcode/username');
  
  const codeforcesResponse = await axios.post<{
    codeforcesUsername: string | null;
  }>('/api/user/codeforces/username');

  if (!leetcodeResponse.data.leetcodeUsername || !codeforcesResponse.data.codeforcesUsername) {
    throw new Error('Usernames not set');
  }

  

  const [leetcodeData, codeforcesData] = await Promise.all([
    fetchUserStats(leetcodeResponse.data.leetcodeUsername) as Promise<LeetCodeStats>,
    fetchCodeforcesUserData(codeforcesResponse.data.codeforcesUsername),
  ]);




  return {
    leetcodeData: leetcodeData,
    codeforcesRating: codeforcesData?.rating || null
  };
};

export default function Dashboard(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();

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
    queryFn: () => fetchPlatformData().catch((error: Error) => {
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

  // const checkPermission = async (id: number): Promise<void> => {
  //   try {
  //     const response = await axios.post<{ hasPermission: boolean }>('/api/checkIfPermission', {
  //       contestId: id
  //     });
  //     console.log(response)
  //     if (!response.data.hasPermission) {
  //       toast.error('You do not have permission to start the contest');
  //       return;
  //     }
      
  //     toast.success('Permission checked, Directing...');
  //     setTimeout(() => {
  //       router.push(`/contest/${id}`);
  //     }, 2000);
  //   } catch (error) {
  //     console.error('Error checking permission:', error);
  //     toast.error('Unable to check permission');
  //   }
  // };

  const handleReset = async (): Promise<void> => {
    try {
      await axios.post('/api/reset');
      toast.success('Reset successful');
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Reset failed');
    }
  };

  const isLoading = isDashboardLoading || isPlatformLoading;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-8 pt-20 space-y-8">
        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-24 bg-slate-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className='text-pretty text-2xl font-sans'>Hi, {dashboardData?.username}</div>
            {dashboardData?.isAdmin && <Button onClick={handleReset}>Reset all tests</Button>}
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/60 backdrop-blur-sm border-purple-100 hover:border-purple-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{dashboardData?.userStats.totalSubmissions}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-green-100 hover:border-green-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Trophy className="h-5 w-5" />
                    Individual Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-900">{dashboardData?.userStats.totalPoints}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-indigo-100 hover:border-indigo-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <Users className="h-5 w-5" />
                    Team: {dashboardData?.userStats.groupName || 'Null'}
                  </CardTitle>
                </CardHeader>
                {dashboardData?.userStats.groupName && (
                  <CardContent>
                    <p className="text-3xl font-bold text-indigo-900">
                      {dashboardData.userStats.groupPoints}
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>

            <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Award className="h-6 w-6" />
                      Your Data
                    </CardTitle>
                    <CardDescription>
                      Be Consistent, and watch your rating rise!
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="icon" className="border-purple-200 hover:bg-purple-50">
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 mt-2 border-slate-200 p-2 rounded-lg border-[0.5px]">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-purple-100/50">
                      <p className='text-sm'>Leetcode Data </p>
                      <div className='grid grid-cols-2 p-2'>
                      <div>
                      <p className="text-md font-medium">Total {platformData?.leetcodeData?.totalSolved} questions solved.</p>
                     
                      </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-100/50">
                      <p className="text-sm">Codeforces Rating</p>
                      <p className="text-lg font-medium">{platformData?.codeforcesRating}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Award className="h-6 w-6" />
                      Latest Contests
                    </CardTitle>
                    <CardDescription>
                      Ready for your next challenge?
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="icon" className="border-purple-200 hover:bg-purple-50">
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dashboardData?.contests.map((contest) => (
                  <div key={contest.startTime} className="space-y-6 mt-2 border-slate-200 p-2 rounded-lg border-[0.5px]">
                    <div className="grid md:grid-cols-5 gap-4">
                      <div className="p-4 rounded-lg bg-purple-100/50">
                        <p className="text-sm">Contest #{contest.id}</p>
                        <p className="text-lg font-medium">{contest.name}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-100/50">
                        <p className="text-sm">Date</p>
                        <p className="text-lg font-medium">{contest.startTime.split('T')[0]}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-200/50">
                        <p className="text-sm">Time</p>
                        <p className="text-lg font-medium">{contest.startTime.split('T')[1].split('.000Z')[0]}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-100/50">
                        <p className="text-sm">Duration</p>
                        <p className="text-lg font-medium">{calculateDuration(contest.startTime, contest.endTime)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-100/50">
                        <p className="text-sm">Status</p>
                        <p className="text-lg font-medium">{contest.status}</p>
                      </div>
                      {dashboardData.isCoordinator && contest.status === 'ACTIVE' && (
                        <Button 
                          size="lg"
                          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white" 
                          asChild
                        >
                          <Link href={`/contest/${contest.id}`} target='_blank'>
                            Start Contest {contest.id}<ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {!dashboardData.isCoordinator && contest.status === 'ACTIVE' && (
                        <Button 
                          size="lg" 
                          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white" 
                          onClick={() => router.push(`/contest/${contest.id}`)}
                        >
                          Start Contest {contest.id}<ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {dashboardData?.userStats.groupName ? (
              <Card className="bg-white/60 backdrop-blur-sm border-indigo-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-indigo-100">
                        <TableHead>Member</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="text-right">Rank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.userStats.groupMembers
                        .sort((a, b) => b.individualPoints - a.individualPoints)
                        .map((member, index) => (
                          <TableRow key={index} className="border-b border-indigo-50">
                            <TableCell className="font-medium text-indigo-900">{member.username}</TableCell>
                            <TableCell className="text-indigo-800">{member.individualPoints}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                index === 0 && "bg-purple-100 text-purple-700",
                                index === 1 && "bg-green-100 text-green-700",
                                index === 2 && "bg-indigo-100 text-indigo-700"
                              )}>
                                #{index + 1}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-purple-700 font-medium">
                You are not part of a Group
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}