'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, CheckCircle, X, ChevronDown, ChevronUp, Ban } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import Link from 'next/link';

interface Question {
  question: {
    id: string;
    leetcodeUrl?: string;
    codeforcesUrl?: string;
    difficulty: string;
    points: number;
    slug: string;
  };
}

interface Submission {
  id: string;
  score: number;
  status: string;
  createdAt: string; // Added createdAt field for submission time
  question: {
    id: string;
    slug: string;
    points: number;
  };
}

interface Member {
  id: string;
  username: string;
  submissions: Submission[];
  isAllowedToParticipate?: boolean;
}

interface Group {
  id: string;
  name: string;
  score: number;
  coordinator: {
    username: string;
  };
  members: Member[];
}

interface GroupOnContest {
  id: string;
  score: number;
  group: Group;
}

interface Contest {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  questions: Question[];
  attemptedGroups: GroupOnContest[];
}

const getRankBadgeColor = (rank: number) => {
  switch(rank) {
    case 1: return "bg-yellow-500";
    case 2: return "bg-gray-400";
    case 3: return "bg-amber-700";
    default: return "bg-slate-600";
  }
};

const GroupSubmissionsLoader = () => (
  <div className="space-y-3">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
);

// Helper function to get the earliest submission time for a member
const getEarliestSubmissionTime = (member: Member) => {
  if (!member.submissions || member.submissions.length === 0) return Infinity;
  
  return Math.min(...member.submissions.map(sub => 
    new Date(sub.createdAt).getTime()
  ));
};

const GroupSubmissions = ({ group, questions, isLoading }: { 
  group: Group; 
  questions: Question[];
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return <GroupSubmissionsLoader />;
  }

  // Sort members by points and submission time
  const sortedMembers = [...group.members].sort((a, b) => {
    // Calculate total points for each member
    const aTotal = a.submissions?.reduce((total, sub) => total + sub.score, 0) || 0;
    const bTotal = b.submissions?.reduce((total, sub) => total + sub.score, 0) || 0;
    
    // First sort by participation status
    if (a.isAllowedToParticipate === false && b.isAllowedToParticipate !== false) return 1;
    if (a.isAllowedToParticipate !== false && b.isAllowedToParticipate === false) return -1;
    
    // Then sort by points (descending)
    if (aTotal !== bTotal) return bTotal - aTotal;
    
    // If points are equal, sort by earliest submission time
    const aEarliest = getEarliestSubmissionTime(a);
    const bEarliest = getEarliestSubmissionTime(b);
    
    return aEarliest - bEarliest; // Earlier submission comes first
  });

  return (
    <div className="mt-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-16 py-4">Rank</TableHead>
            <TableHead className="w-32 py-4">Member</TableHead>
            {questions?.map((q, index) => (
              <TableHead key={q.question.id} className="text-center py-4">
                <div className="font-semibold">Q{String.fromCharCode(65 + index)}</div>
                <div className="text-xs text-gray-500 font-normal">
                  {q.question.points} pts
                </div>
              </TableHead>
            ))}
            <TableHead className="text-right py-4 pr-6">Total Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member, index) => {
            const memberTotal = member.submissions?.reduce((total, sub) => total + sub.score, 0) || 0;
            
            return (
              <TableRow key={member.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium py-4">
                  {member.isAllowedToParticipate === false ? "-" : index + 1}
                </TableCell>
                <TableCell className="font-medium py-4">
                  <div className="flex items-center gap-2">
                    {member.username}
                    {member.isAllowedToParticipate === false && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <Ban className="h-3 w-3" />
                        Not Allowed
                      </span>
                    )}
                  </div>
                </TableCell>
                {questions?.map((q) => {
                  const submission = member.submissions?.find(
                    (s) => s.question.id === q.question.id
                  );
                  
                  if (member.isAllowedToParticipate === false) {
                    return (
                      <TableCell key={q.question.id} className="text-center py-4">
                        <div className="flex flex-col items-center">
                          <Ban className="h-5 w-5 text-red-400" />
                          <span className="text-xs text-red-400 mt-1">
                            Not Allowed
                          </span>
                        </div>
                      </TableCell>
                    );
                  }
                  
                  return (
                    <TableCell key={q.question.id} className="text-center py-4">
                      {submission ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600 mt-1">
                            {submission.score}
                          </span>
                          {/* Display submission time */}
                          <span className="text-xs text-gray-500">
                            {new Date(submission.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <X className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-400 mt-1">
                            0
                          </span>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold py-4 pr-6">
                  {member.isAllowedToParticipate === false ? (
                    <span className="text-red-500">N/A</span>
                  ) : (
                    memberTotal
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-gray-50">
            <TableCell colSpan={questions.length + 2} className="font-bold py-4">
              Group Total
            </TableCell>
            <TableCell className="text-right font-bold py-4 pr-6">
              {group.score}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const GroupDetails = ({ group, questions, rank, isLoading }: { 
  group: Group; 
  questions: Question[]; 
  rank: number;
  isLoading?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const participatingMembers = group.members.filter(m => m.isAllowedToParticipate !== false);
  const nonParticipatingMembers = group.members.filter(m => m.isAllowedToParticipate === false);

  return (
    <div className="border rounded-lg mb-4 overflow-hidden shadow-sm">
      <div 
        className="px-6 py-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Badge 
            className={`${getRankBadgeColor(rank)} w-10 h-10 flex items-center justify-center rounded-full mr-4 text-white font-bold`}
          >
            {rank}
          </Badge>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">{group.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Coordinator: {group.coordinator?.username} • 
              Participating: {participatingMembers.length} • 
              Not Allowed: {nonParticipatingMembers.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold text-lg">{group.score}</div>
              <div className="text-sm text-gray-500">points</div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-6 w-6 text-gray-400" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t">
          <GroupSubmissions 
            group={group}
            questions={questions}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

const ContestDetails = ({ contest, isLoading }: { contest: Contest; isLoading?: boolean }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-4">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <div>
          <Link href={`/contest/${contest.id}`} target='_blank'>
            <span className='text-blue-700'>Contest #{contest.id}</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(contest.startTime).toLocaleDateString()} - 
              {new Date(contest.endTime).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Questions</h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16">#</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contest.questions?.map((q, index) => (
              <TableRow key={q.question.id} className="hover:bg-gray-50">
                <TableCell>{String.fromCharCode(65 + index)}</TableCell>
                <TableCell>
                  <Link 
                    href={q.question.leetcodeUrl || q.question.codeforcesUrl || ''} 
                    target='_blank'
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {q.question.slug}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-medium">{q.question.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Rankings</h3>
        {contest.attemptedGroups?.length ? (
          contest.attemptedGroups.map((groupEntry, index) => (
            <GroupDetails
              key={groupEntry.id}
              group={groupEntry.group}
              questions={contest.questions || []}
              rank={index + 1}
              isLoading={isLoading}
            />
          ))
        ) : (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            No groups have attempted this contest yet.
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const ContestsPage = () => {
  const { data: contests, isLoading, error } = useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const response = await axios.get('/api/contests');
      console.log(response)
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        <span>Loading contests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 mt-20">
        <div className="max-w-4xl mx-auto text-center text-red-500">
          Error loading contests. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Contest History
        </h1>
        {contests?.length ? (
          contests.map((contest: Contest) => (
            <ContestDetails 
              key={contest.id} 
              contest={contest} 
              isLoading={isLoading}
            />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              No contests available.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;