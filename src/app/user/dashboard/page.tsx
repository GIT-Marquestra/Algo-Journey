'use client'
import React, { useEffect, useState } from 'react';
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
import { Trophy, Users, Target, ChevronRight, Award, Clock } from "lucide-react"
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { getDuration } from '@/serverActions/getDuration';
import { cn } from "@/lib/utils"
import { redirect } from 'next/navigation';

interface UserStats {
  totalSubmissions: number;
  totalPoints: number;
  groupName: string;
  groupMembers: {
    username: string;
    individualPoints: number;
  }[];
}

interface Contest {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
}

export default function Dashboard() {
  const [latestContests, setLatestContests] = useState<Contest[] | null>(null);
  const [username, setUsername] = useState<string>('');
  const [latestContest, setLatestContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSubmissions: 0,
    totalPoints: 0,
    groupName: '',
    groupMembers: []
  });
  
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.post('/api/getUsername')
        setUsername(res.data.username)
        const contestsResponse = await axios.get('/api/getData');
        setLatestContests(contestsResponse.data.latestContests);
        setLatestContest(contestsResponse.data.latestContests[0]);
        
        setUserStats({
          totalSubmissions: contestsResponse.data.submissionCount,
          totalPoints: contestsResponse.data.user.individualPoints,
          groupName: contestsResponse.data.user.group?.name,
          groupMembers: contestsResponse.data.user.group?.members
        });
      } catch (error) {
        console.log(error)
        toast.error('Unable to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);


  console.log(session)
  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-8 pt-20 space-y-8">
        {loading ? (
          // Loading skeleton with subtle animations
          <div className="space-y-8 animate-pulse">
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map(() => (
                <Card key={Math.random()} className="bg-white/60 backdrop-blur-sm">
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
            <div className='text-pretty text-2xl font-sans'>Hi, {username}</div>
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
                    Group: {userStats.groupName ? userStats.groupName : 'Null'}
                  </CardTitle>
                </CardHeader>
                {userStats.groupName && (
                  <CardContent>
                    <p className="text-3xl font-bold text-indigo-900">
                      {userStats.groupMembers.reduce((sum, member) => sum + member.individualPoints, 0)}
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
                {latestContests?.map((contest) => (
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
                        <p className="text-lg font-medium">{contest.startTime.split('T')[1]}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-100/50">
                        <p className="text-sm">Status</p>
                        <p className="text-lg font-medium">{contest.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              {latestContests?.map((contest) => (
                contest.status === 'ACTIVE' && (
                  <CardFooter key={contest.id}>
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white" 
                      asChild
                    >
                      <Link href={`/contest/${contest.id}`}>
                        Attempt Contest {contest.id}<ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                )
                ))}
            </Card>

            {userStats.groupName ? (
              <Card className="bg-white/60 backdrop-blur-sm border-indigo-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Group Members
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
          </>
        )}
      </div>
    </div>
  );
}