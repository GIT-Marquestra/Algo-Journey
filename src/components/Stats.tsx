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
import Link from 'next/link';

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
      {users ? users.map((u) => (<Card key={u.id} className="p-4 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <Link href={`/user/updateProfile/${u.username}`} target='_blank'>
                <h4 className="text-sm font-semibold text-blue-700">{u.username}</h4>
              </Link>
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



const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)
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
      setFilteredUsers(response.data.usersArray)
    } catch (error) {
        console.log(error)
        toast.error('Some error occured')
    } finally {
      setLoading(false)
    }
  }, [setUsers, setNumbers])

    

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
          title="Total Teams"
          value={numbers.totalGroups.toString()}
          description="Active groups"
          loading={loading}
        />
        <StatsCard
          title="All Contests"
          value={numbers.activeContests.toString()}
          description="Contests"
          loading={loading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
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

       
      </Tabs>
    </div>
  );
};

export default AdminDashboard;