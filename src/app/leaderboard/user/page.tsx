"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Any {
  id: string,
  name: string,
  username: string,
  coordinatorName: string,
  individualPoints: string,
  groupPoints: string
}


const fetchLeaderboardData = async (endpoint: string) => {
  const response = await axios.post(endpoint);
  return response.data;
};

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

  const renderLeaderboardRow = (item: Any, index: number, type: string) => (
    <div key={item.id} className="flex items-center py-4 border-b border-gray-200">
      <div className="w-16 text-center font-bold">{index + 1}</div>
      <div className="flex-1">
        <p className="font-medium">{type === "group" ? item.name : item.username}</p>
        {type === "group" && (
          <p className="text-sm text-gray-500">Coordinator: {item.coordinatorName}</p>
        )}
      </div>
      <div className="w-24 text-right font-bold">
        {type === "group" ? item.groupPoints : item.individualPoints} points
      </div>
    </div>
  );

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
              <TabsTrigger value="group">Group Rankings</TabsTrigger>
              <TabsTrigger value="individual">Individual Rankings</TabsTrigger>
            </TabsList>

            <TabsContent value="group">
              <div className="space-y-1">
                {groupLoading ? (
                  <div className="text-center py-8">Loading group rankings...</div>
                ) : (
                  groupData?.map((group: Any, index: number) =>
                    renderLeaderboardRow(group, index, "group")
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="individual">
              <div className="space-y-1">
                {userLoading ? (
                  <div className="text-center py-8">Loading individual rankings...</div>
                ) : (
                  userData?.map((user: Any, index: number) =>
                    renderLeaderboardRow(user, index, "individual")
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;