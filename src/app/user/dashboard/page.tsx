'use client'
import React, { useEffect, useState } from 'react';
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

interface DashboardData {
  latestContests: Contest[];
  submissionCount: number;
  user: {
    individualPoints: number;
    group?: {
      name: string;
      groupPoints: number;
      members: {
        username: string;
        individualPoints: number;
      }[];
    };
  };
}

interface Contest {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
}

interface UserStats {
  totalSubmissions: number;
  totalPoints: number;
  groupName: string;
  groupPoints: number;
  groupMembers: {
    username: string;
    individualPoints: number;
  }[];
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [leetcodeRanking, setLeetcodeRanking] = useState<number | null>(null);
  const [codeforcesRating, setCodeforcesRating] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isCoord, setIsCoord] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const Router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, coordResponse, usernameResponse] = await Promise.all([
          axios.get('/api/getData'),
          axios.post('/api/checkIfCoordinator'),
          axios.post('/api/getUsername')
        ]);

        setDashboardData(dashboardResponse.data);
        setIsCoord(coordResponse.data.isCoordinator);
        setUsername(usernameResponse.data.username);
        
        const adminResponse = await axios.post('/api/checkIfAdmin');
        setIsAdmin(adminResponse.data.isAdmin);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Unable to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchPlatformData = async () => {
      try {
        const [leetcodeUsername, codeforcesUsername] = await Promise.all([
          axios.post('/api/user/leetcode/username'),
          axios.post('/api/user/codeforces/username')
        ]);

        if (!leetcodeUsername.data.leetcodeUsername || !codeforcesUsername.data.codeforcesUsername) {
          toast.error('Please set your leetcode and codeforces usernames in settings');
          return;
        }

        const [leetcodeData, codeforcesData] = await Promise.all([
          fetch(`/api/leetcode/${leetcodeUsername.data.leetcodeUsername}`).then(res => res.json()),
          fetch(`/api/codeforces/${codeforcesUsername.data.codeforcesUsername}`).then(res => res.json())
        ]);

        setLeetcodeRanking(leetcodeData?.matchedUser?.profile?.ranking ?? null);
        setCodeforcesRating(codeforcesData?.rating ?? null);
      } catch (error) {
        console.error('Error fetching platform data:', error);
      }
    };

    fetchDashboardData();
    fetchPlatformData();
  }, [session]);

  const checkPermission = async (id: number) => {
    try {
      const response = await axios.post('/api/checkIfPermission', { contestId: id });
      if (!response.data.hasPermission) {
        toast.error('You do not have permission to start the contest');
        return;
      }
      toast.success('Permission checked, Directing...');
      Router.push(`/contest/${id}`);
    } catch (error) {
      toast.error('Unable to check permission');
    }
  };

  const handleReset = async () => {
    try {
      await axios.post('/api/reset');
      toast.success('Reset successful');
    } catch (error) {
      toast.error('Reset failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen container mx-auto p-8 pt-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white/60 backdrop-blur-sm h-32" />
          ))}
        </div>
      </div>
    );
  }

  const userStats: UserStats = {
    totalSubmissions: dashboardData?.submissionCount ?? 0,
    totalPoints: dashboardData?.user.individualPoints ?? 0,
    groupName: dashboardData?.user.group?.name ?? '',
    groupPoints: dashboardData?.user.group?.groupPoints ?? 0,
    groupMembers: dashboardData?.user.group?.members ?? []
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-8 pt-20 space-y-8">
        <div className='text-pretty text-2xl font-sans'>Hi, {username}</div>
        {isAdmin && <Button onClick={handleReset}>Reset all tests</Button>}
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white/60 backdrop-blur-sm border-purple-100 hover:border-purple-200 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userStats.totalSubmissions}</p>
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
              <p className="text-3xl font-bold text-green-900">{userStats.totalPoints}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-indigo-100 hover:border-indigo-200 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Users className="h-5 w-5" />
                Team: {userStats.groupName || 'Null'}
              </CardTitle>
            </CardHeader>
            {userStats.groupName && (
              <CardContent>
                <p className="text-3xl font-bold text-indigo-900">
                  {userStats.groupPoints}
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
                  <p className="text-sm">Leetcode Rank</p>
                  <p className="text-lg font-medium">{leetcodeRanking}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-100/50">
                  <p className="text-sm">Codeforces Rating</p>
                  <p className="text-lg font-medium">{codeforcesRating}</p>
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
            {dashboardData?.latestContests?.map((contest) => (
              <div key={contest.startTime} className="space-y-6 mt-2 border-slate-200 p-2 rounded-lg border-[0.5px]">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-purple-100/50">
                    <p className="text-sm">Contest</p>
                    <p className="text-lg font-medium">{contest.id}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-100/50">
                    <p className="text-sm">Date</p>
                    <p className="text-lg font-medium">{contest.startTime.split('T')[0]}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-200/50">
                    <p className="text-sm">Time</p>
                    <p className="text-lg font-medium">{contest.startTime.split('T')[1].split('.000Z')[0]}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-100/50">
                    <p className="text-sm">Status</p>
                    <p className="text-lg font-medium">{contest.status}</p>
                  </div>
                  {isCoord && contest.status === 'ACTIVE' && (
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white" 
                      asChild
                    >
                      <Link href={`/contest/${contest.id}`}>
                        Start Contest {contest.id}<ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {!isCoord && contest.status === 'ACTIVE' && (
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => checkPermission(contest.id)}
                    >
                      Start Contest {contest.id}<ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {userStats.groupName ? (
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
                  {userStats.groupMembers
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
          <div className="text-center text-purple-700 font-medium">You are not part of a Group</div>
        )}
      </div>
    </div>
  );
}