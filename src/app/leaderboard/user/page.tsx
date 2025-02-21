'use client';
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  weeklyPoints: number;
}

interface Group {
  id: string;
  name: string;
  groupPoints: number;
  coordinatorName: string;
  memberCount: number;
}

const fetchLeaderboardData = async (endpoint: string, weekOffset: number = 0) => {
  const response = await axios.post(endpoint, { weekOffset });
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

const WeekSelector = ({ 
  weekOffset, 
  setWeekOffset,
  isLoading
}: { 
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  isLoading: boolean;
}) => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - (weekOffset * 7));
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  return (
    <div className="flex items-center justify-between mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setWeekOffset(weekOffset + 1)}
        disabled={isLoading}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous Week
      </Button>
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        <span>Week of {startOfWeek.toLocaleDateString()}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setWeekOffset(weekOffset - 1)}
        disabled={weekOffset === 0 || isLoading}
      >
        Next Week
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

const GroupRankings = ({ groups }: { groups: Group[] | undefined }) => {
  if (!groups) return null;
  
  return (
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
};

const WeeklyRankings = ({ users }: { users: User[] | undefined }) => {
  if (!users) return null;

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No rankings available for this week
      </div>
    );
  }

  return (
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
              <Link href={`/user/updateProfile/${user.username}`} target="_blank">
                <p className="font-medium text-blue-700">{user.username}</p>
              </Link>
            </div>
          </div>
          <div className="w-24 text-right font-bold">
            {user.weeklyPoints} points
          </div>
        </div>
      ))}
    </div>
  );
};

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
    <span>{message}</span>
  </div>
);

const LeaderboardPage = () => {
  const [leaderboardType, setLeaderboardType] = useState("group");
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: groupData, isLoading: groupLoading, error: groupError } = useQuery({
    queryKey: ["groupLeaderboard"],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/groups"),
  });

  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError } = useQuery({
    queryKey: ["weeklyLeaderboard", weekOffset],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/weekly", weekOffset),
  });

  const renderContent = (type: string) => {
    if (type === "group") {
      if (groupLoading) return <LoadingState message="Loading group rankings..." />;
      if (groupError) return <div className="text-center py-8 text-red-500">Error loading group rankings</div>;
      return <GroupRankings groups={groupData} />;
    } else {
      if (weeklyLoading) return <LoadingState message="Loading weekly rankings..." />;
      if (weeklyError) return <div className="text-center py-8 text-red-500">Error loading weekly rankings</div>;
      return (
        <>
          <WeekSelector 
            weekOffset={weekOffset} 
            setWeekOffset={setWeekOffset}
            isLoading={weeklyLoading}
          />
          <WeeklyRankings users={weeklyData} />
        </>
      );
    }
  };

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
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="group">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group Rankings
                </div>
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Weekly Rankings
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="group">
              {renderContent("group")}
            </TabsContent>

            <TabsContent value="weekly">
              {renderContent("weekly")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;