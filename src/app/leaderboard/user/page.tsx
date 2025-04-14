'use client';
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, User, Users, ChevronLeft, ChevronRight, Trophy, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useStore from "@/store/store";

interface User {
  id: string;
  username: string;
  weeklyPoints: number;
  rank?: number;
  avatar?: string;
}

interface Group {
  id: string;
  name: string;
  groupPoints: number;
  coordinatorName: string;
  memberCount: number;
  rank?: number;
}

const fetchLeaderboardData = async (endpoint: string, weekOffset: number = 0) => {
  const response = await axios.post(endpoint, { weekOffset });
  return response.data;
};

const getRankColor = (rank: number) => {
  switch(rank) {
    case 1: return "bg-yellow-500 text-white";
    case 2: return "bg-gray-400 text-white";
    case 3: return "bg-amber-700 text-white";
    default: return "bg-slate-100 text-gray-700";
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
    <div className="flex items-center justify-between mb-6 bg-white/90 p-4 rounded-lg shadow-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setWeekOffset(weekOffset + 1)}
        disabled={isLoading}
        className="hover:bg-gray-100"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous Week
      </Button>
      
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <Calendar className="h-5 w-5 text-indigo-500" />
        <span className="font-medium">Week of {startOfWeek.toLocaleDateString()}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setWeekOffset(weekOffset - 1)}
        disabled={weekOffset === 0 || isLoading}
        className="hover:bg-gray-100"
      >
        Next Week
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

const GroupRankings = ({ groups }: { groups: Group[] | undefined }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white/90 rounded-lg shadow-sm">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        No group rankings available
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <div 
          key={group.id} 
          className="flex items-center p-4 bg-white/90 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div 
            className={`${getRankColor(index + 1)} w-10 h-10 flex items-center justify-center rounded-full mr-4 text-lg font-bold`}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <p className="font-semibold text-gray-800">{group.name}</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Coordinator: {group.coordinatorName} • {group.memberCount} Members
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span className="text-lg font-bold text-gray-800">
              {group.groupPoints} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const WeeklyRankings = ({ users }: { users: User[] | undefined }) => {
  const { isAdmin } = useStore()
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white/90 rounded-lg shadow-sm">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        No rankings available for this week
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user, index) => (
        <div 
          key={user.id} 
          className="flex items-center p-4 bg-white/90 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div 
            className={`${getRankColor(index + 1)} w-10 h-10 flex items-center justify-center rounded-full mr-4 text-lg font-bold`}
          >
            {index + 1}
          </div>
          <div className="flex-1 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-500" />
            {isAdmin ? <Link href={`/user/updateProfile/${user.username}`} target="_blank">
              <p className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                {user.username}
              </p>
            </Link> : <p className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                {user.username}
              </p>}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-indigo-500" />
            <span className="text-lg font-bold text-gray-800">
              {user.weeklyPoints} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-8 bg-white/90 rounded-lg shadow-sm">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
    <span className="text-gray-600">{message}</span>
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
      if (groupError) return <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">Error loading group rankings</div>;
      return <GroupRankings groups={groupData} />;
    } else {
      if (weeklyLoading) return <LoadingState message="Loading weekly rankings..." />;
      if (weeklyError) return <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">Error loading weekly rankings</div>;
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
    <div className="min-h-screen bg-gray-50 py-12 mt-10">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="bg-white/90 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Competitive Programming Leaderboard
            </h1>
          </div>

          <Tabs
            defaultValue="group"
            value={leaderboardType}
            onValueChange={setLeaderboardType}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
              <TabsTrigger 
                value="group" 
                className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group Rankings
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
              >
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
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;