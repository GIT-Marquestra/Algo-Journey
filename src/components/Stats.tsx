'use client'
import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import SearchInput from './SearchInput';
import Modal from './ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  section: string;
  group: {
    name: string
  };
  leetcodeUsername: string;
  codeforcesUsername: string;
  individualPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupOnContest {
  id: string;
  name: string;
  members: User[];
  score: number;
  group: Group;
}

interface Group {
  id: string;
  name: string;
  members: User[];
  coordinator: User;
  points: number;
}

interface Contest {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}





const StatsCard = ({ title, value, description, loading }: { title: string, value: string, description: string, loading: boolean }) => (
  <Card className="w-full">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-[100px]" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);

const UserData = ({ user }: {user: User | null}) => {
  return (
  
    <div className="py-4">
      {user ? <div className="space-y-2">
        <p><strong>Name:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Points:</strong> {user.individualPoints}</p>
        <p><strong>Group:</strong> {user.group.name}</p>
        <p><strong>Section:</strong> {user.section}</p>
        <p><strong>Leetcode Username:</strong> {user.leetcodeUsername}</p>
        <p><strong>CodeForces Username:</strong> {user.codeforcesUsername}</p>
      </div> : <div>No user found</div>}
    </div>
  );
};
const GroupData = ({ group }: {group: Group | null}) => {
  return (
  
    <div className="py-4">
      {group ? <div className="space-y-2">
        <p><strong>Name:</strong> {group.name}</p>
        <p><strong>Points:</strong> {group.points}</p>
        <p><strong>Corrdinator:</strong> {group.coordinator.username}</p>
        {group.members.map((m) => (<p key={m.username}><strong>Member:</strong> {m.username}</p>))}
      </div> : <div>No user found</div>}
    </div>
  );
};

const ContestLeaderboard = ({ groups }: { groups: GroupOnContest[] | null }) => {

  if(!groups) return <div>No groups found</div>

  const sortedGroups = [...groups].sort((a, b) => 
    (b.score || 0) - (a.score || 0)
  );


  const getRankBadgeColor = (rank: number) => {
    switch(rank) {
      case 1: return "bg-yellow-500 hover:bg-yellow-600";
      case 2: return "bg-gray-400 hover:bg-gray-500";
      case 3: return "bg-amber-700 hover:bg-amber-800";
      default: return "bg-slate-600 hover:bg-slate-700";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Contest Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Group Name</TableHead>
              <TableHead>Coordinator</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map((group, index) => (
              <TableRow key={group.id} className="hover:bg-muted/50">
                <TableCell>
                  <Badge 
                    className={`${getRankBadgeColor(index + 1)} w-8 h-8 flex items-center justify-center rounded-full`}
                  >
                    {index + 1}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{group.group.name}</TableCell>
                <TableCell>{group.group.coordinator.username}</TableCell>
                <TableCell className="text-right">
                  {group.group.members.length}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {group.score || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


const UserList = ({ loading, users }: { loading: boolean, users: User[] }) => {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const handleViewDetails = async (id: string) => {
    try {
      const response = await axios.post('/api/getUserDetails', { id })
      console.log(response)
      if(!response.data.userDetail) return toast.error('User not found')  
      setUserDetails(response.data.userDetail)
      toast.success('Viewing user details')
    } catch (error) {
      console.log(error)
      toast.error('Some error occured')
    }
  }

  return (
    <div className="space-y-4">
      {users ? users.map((u) => (<Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{u.username}</h4>
              <p className="text-sm text-muted-foreground">Section {u.section} • {u.individualPoints} points</p>
              <p className="text-sm text-muted-foreground">{u.email}</p>
            </div>
          </div>
          <Modal
          trigger={<Button variant="outline" size="sm" onClick={() => handleViewDetails(u.id)}>View Details</Button>}
          title="User Information"
          >
            <UserData user={userDetails}/>
          </Modal>
        </div>
      </Card>)) : <div>No users found</div>}
    </div>
  );
};


const GroupList = ({ loading, groups }: { loading: boolean, groups: Group[] }) => {
  const [groupDetails, setGroupDetails] = useState<Group | null>(null);
  const handleViewDetails = async (id: string) => {
    try {
      const response = await axios.post('/api/getGroupDetails', { id })
      console.log('GroupDetails: ', response)
      if(!response.data.group) return toast.error('User not found')  
      setGroupDetails(response.data.group)
      toast.success('Viewing user details')
    } catch (error) {
      console.log(error)
      toast.error('Some error occured')
    }
  }
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups ? groups.map((g: Group) => (<Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{g.name}</h4>
            <p className="text-sm text-muted-foreground">Coordinator: {g.coordinator.username}</p>
            <p className="text-sm text-muted-foreground">Members: {g.members.length} • Points: {g.points}</p>
          </div>
          <Modal
          trigger={<Button variant="outline" size="sm" onClick={() => handleViewDetails(g.id)}>
          View Details
        </Button>}
          title="Group Information"
          >
            <GroupData group={groupDetails}/>
          </Modal>
        </div>
      </Card>)) : <div>No groups found</div>}
    </div>
  );
}; 

const ContestList = ({ loading, contests }: { loading: boolean, contests: Contest[] }) => {
  const [contestDetails, setContestDetails] = useState<GroupOnContest[] | null>(null);
  const handleViewDetails = async (id: number) => {
    try {
      const response = await axios.post('/api/getContestDetails', { id })
      setContestDetails(response.data.rankedGroups)

    } catch (error) {
      console.log('Error in Contests View Details: ', error)
      toast.error('Some error occured')
    }

  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contests ? contests.map((g: Contest) => (<Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Contest: {g.id}</h4>
            <p className="text-sm text-muted-foreground">Created At: {g.createdAt.toString()} • Updated At: {g.updatedAt.toString()}</p>
          </div>
          <Modal
          trigger={<Button variant="outline" size="sm" onClick={()=>handleViewDetails(g.id)}>View Details</Button>}
          title="Contest Information"
          >
          <ContestLeaderboard groups={contestDetails}/>
          </Modal>
        </div>
      </Card>)) : <div>No Contests found</div>}
    </div>
  );
};


const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [contests, setContests] = useState([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)
  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups)
  const [filteredContests, setFilteredContests] = useState<Contest[]>(contests)
  const [numbers, setNumbers] = useState({
    totalUsers: 0,
    totalGroups: 0,
    activeContests: 0
  });
  const Router = useRouter()

  const getNumbers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.post('/api/checkIfAdmin')
      if(!res.data.isAdmin) {
        toast.error('You are not authorized to access this page')
        Router.push('/')  
        return
      }
      const response = await axios.post('/api/getNumbers')
      console.log(response)
      setNumbers({
        totalUsers: response.data.totalUsers,
        totalGroups: response.data.totalGroups,
        activeContests: response.data.totalContests
      })
      console.log(response.data.usersArray)
      setUsers(response.data.usersArray)
      setFilteredContests(response.data.contestsArray)
      setFilteredGroups(response.data.groupsArray)
      setFilteredUsers(response.data.usersArray)
      setGroups(response.data.groupsArray)
      setContests(response.data.contestsArray)
      console.log(users, groups, contests)
    } catch (error) {
        console.log(error)
        toast.error('Some error occured')
    } finally {
      setLoading(false)
    }
  }, [setContests, setGroups, setUsers, setNumbers])

    

  useEffect(() => {
    getNumbers()
  }, [getNumbers])


  return (
    <div className="container mx-auto p-6 space-y-8 mt-16">
      <h2 className="text-3xl font-bold tracking-tight">Stats</h2>
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={numbers.totalUsers.toString()}
          description="Active students"
          loading={loading}
        />
        <StatsCard
          title="Total Groups"
          value={numbers.totalGroups.toString()}
          description="Active groups"
          loading={loading}
        />
        <StatsCard
          title="Active Contests"
          value={numbers.activeContests.toString()}
          description="Ongoing contests"
          loading={loading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>View and manage all registered students</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchInput<User> items={users} onResultsChange={setFilteredUsers} />   
              <ScrollArea className="h-[400px] pr-4">
                <UserList loading={loading} users={filteredUsers} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
              <CardDescription>View and manage all active groups</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchInput<Group> items={groups} searchFields={[
                'name',
              ]} onResultsChange={setFilteredGroups} 
                placeholder="Search groups..."
              />
              <ScrollArea className="h-[400px] pr-4">
                <GroupList loading={loading} groups={filteredGroups} />
              </ScrollArea>
            </CardContent>
          
          </Card>
        </TabsContent>

        <TabsContent value="contests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Statistics</CardTitle>
              <CardDescription>Overview of all contests and their statistics</CardDescription>
            </CardHeader>
            <CardContent>
            <SearchInput<Contest> items={contests} onResultsChange={setFilteredContests} />
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                </div>
              ) : (
                <ContestList loading={loading} contests={contests}/>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;