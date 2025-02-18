'use client';
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, User, Users } from "lucide-react";
import axios from "axios";

interface User {
  id: string;
  username: string;
  individualPoints: number;
}

interface Group {
  id: string;
  name: string;
  groupPoints: number;
  coordinatorName: string;
  memberCount: number;
}

interface Contest {
  id: number;
  name: string;
  date: string;
  rankedGroups: GroupOnContest[];
}

interface GroupOnContest {
  id: string;
  score: number;
  group: {
    name: string;
    coordinator: {
      username: string;
    };
    members: {
      username: string;
    }[];
  };
}

const fetchLeaderboardData = async (endpoint: string) => {
  const response = await axios.post(endpoint);
  return response.data;
};

const getRankBadgeColor = (rank: number) => {
  switch(rank) {
    case 1: return "bg-yellow-500";
    case 2: return "bg-gray-400";
    case 3: return "bg-amber-700";
    default: return "bg-slate-600";
  }
};

const GroupRankings = ({ groups }: { groups: Group[] }) => (
  <div className="space-y-1">
    {groups.map((group, index) => (
      <div key={group.id} className="flex items-center py-4 border-b border-gray-200">
        <Badge 
          className={`${getRankBadgeColor(index + 1)} w-8 h-8 flex items-center justify-center rounded-full mr-4`}
        >
          {index + 1}
        </Badge>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="font-medium">{group.name}</p>
          </div>
          <p className="text-sm text-gray-500">
            Coordinator: {group.coordinatorName} • Members: {group.memberCount}
          </p>
        </div>
        <div className="w-24 text-right font-bold">
          {group.groupPoints} points
        </div>
      </div>
    ))}
  </div>
);

const UserRankings = ({ users }: { users: User[] }) => (
  <div className="space-y-1">
    {users.map((user, index) => (
      <div key={user.id} className="flex items-center py-4 border-b border-gray-200">
        <Badge 
          className={`${getRankBadgeColor(index + 1)} w-8 h-8 flex items-center justify-center rounded-full mr-4`}
        >
          {index + 1}
        </Badge>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <p className="font-medium">{user.username}</p>
          </div>
        </div>
        <div className="w-24 text-right font-bold">
          {user.individualPoints} points
        </div>
      </div>
    ))}
  </div>
);

const ContestRankings = ({ contests }: { contests: Contest[] }) => (
  <div className="space-y-4">
    <Accordion type="single" collapsible className="w-full">
      {contests.map((contest) => (
        <AccordionItem key={contest.id} value={`contest-${contest.id}`}>
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex items-center gap-4 w-full">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div className="flex-1 text-left">
                <h3 className="font-semibold">{contest.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(contest.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 px-4 pt-2">
              {contest.rankedGroups.map((group, index) => (
                <div key={group.id} className="flex items-center py-3 border-b border-gray-200">
                  <Badge 
                    className={`${getRankBadgeColor(index + 1)} w-8 h-8 flex items-center justify-center rounded-full mr-4`}
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <p className="font-medium">{group.group.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      Coordinator: {group.group.coordinator.username} • 
                      Members: {group.group.members.length}
                    </p>
                  </div>
                  <div className="w-24 text-right font-bold">
                    {group.score} points
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
    <span>{message}</span>
  </div>
);

const LeaderboardPage = () => {
  const [leaderboardType, setLeaderboardType] = useState("group");

  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["groupLeaderboard"],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/groups"),
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["userLeaderboard"],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/users"),
  });

  const { data: contestData, isLoading: contestLoading } = useQuery({
    queryKey: ["contestLeaderboard"],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/contests"),
  });

  return (
    <div className="container mx-auto py-8 mt-20">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Competitive Programming Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="group"
            value={leaderboardType}
            onValueChange={setLeaderboardType}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="group">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group Rankings
                </div>
              </TabsTrigger>
              <TabsTrigger value="individual">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Individual Rankings
                </div>
              </TabsTrigger>
              <TabsTrigger value="contests">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Contest Rankings
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="group">
              {groupLoading ? (
                <LoadingState message="Loading group rankings..." />
              ) : (
                <GroupRankings groups={groupData} />
              )}
            </TabsContent>

            <TabsContent value="individual">
              {userLoading ? (
                <LoadingState message="Loading individual rankings..." />
              ) : (
                <UserRankings users={userData} />
              )}
            </TabsContent>

            <TabsContent value="contests">
              {contestLoading ? (
                <LoadingState message="Loading contest rankings..." />
              ) : (
                <ContestRankings contests={contestData} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;