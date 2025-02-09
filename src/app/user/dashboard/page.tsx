"use client"
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
  const [latestContest, setLatestContest] = useState<Contest | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSubmissions: 0,
    totalPoints: 0,
    groupName: '',
    groupMembers: []
  });
  
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contestsResponse = await axios.get('/api/getData');
        console.log(contestsResponse.data)
        setLatestContest(contestsResponse.data.latestContest)
        
        
        setUserStats({
          totalSubmissions: contestsResponse.data.submissionCount,
          totalPoints: contestsResponse.data.user.individualPoints,
          groupName: contestsResponse.data.user.group?.name,
          groupMembers: contestsResponse.data.user.group?.members
        });
      } catch (error) {
        console.log(error)
        toast.error('Unable to fetch dashboard data');
      }
    };

    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);

  return (
    <div className="container mx-auto p-8 pt-20 space-y-8">
      {/* User Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userStats.totalSubmissions}</p>
          </CardContent>
          <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-24 h-24 bg-primary/10 rounded-full" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              Individual Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userStats.totalPoints}</p>
          </CardContent>
          <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-24 h-24 bg-primary/10 rounded-full" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              Group: {userStats.groupName ? userStats.groupName : 'Null'}
            </CardTitle>
          </CardHeader>
          {userStats.groupName && <CardContent>
            <p className="text-3xl font-bold">
              {userStats.groupMembers.reduce((sum, member) => sum + member.individualPoints, 0)}
            </p>
          </CardContent>}
          <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-24 h-24 bg-primary/10 rounded-full" />
        </Card>
      </div>

      {/* Latest Contest Section */}
      <Card className="relative overflow-hidden border-2 border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                <Award className="h-6 w-6" />
                Latest Contest
              </CardTitle>
              <CardDescription>
                Ready for your next challenge?
              </CardDescription>
            </div>
            <Button variant="outline" size="icon">
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {latestContest ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-medium">{new Date(latestContest.startTime).toLocaleDateString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-medium">{getDuration(latestContest.startTime, latestContest.endTime)}</p>
                </div>
                <div className="p-4 rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-medium">{latestContest.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No contests available at the moment.</p>
          )}
        </CardContent>
        {(latestContest?.status === 'ACTIVE') && <CardFooter className="relative">
          {latestContest && (
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href={`/contest/${latestContest.id}`}>
                Attempt Contest <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardFooter>}
      </Card>

      {/* Group Members Section */}
      {userStats.groupName ? <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            Group Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">Rank</TableHead>
              </TableRow>
            </TableHeader>
            {userStats.groupName && <TableBody>
              {userStats.groupMembers
                .sort((a, b) => b.individualPoints - a.individualPoints)
                .map((member, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{member.username}</TableCell>
                    <TableCell>{member.individualPoints}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        index === 0 && "bg-primary/10 text-primary",
                        index === 1 && "bg-secondary/10 text-secondary",
                        index === 2 && "bg-muted text-muted-foreground"
                      )}>
                        #{index + 1}
                      </span>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>}
          </Table>
        </CardContent>
      </Card> : <div className='flex justify-center'>You are not part of a Group</div>}
    </div>
  );
}

