
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { revalidatePath } from 'next/cache';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  coordinator: User;
  coordinatorId: string;
  _count: {
    members: number
  }
  groupPoints: number;
}

const GroupManagement = () => {
  const [showExistingGroups, setShowExistingGroups] = useState(false);
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [userGroups, setUserGroups] = useState<Group>();
  const { data: session } = useSession();


  const fetchUserGroups = useCallback(async () => {
    try {
      const response = await axios.post('/api/groups', {
        body: {
          userEmail: session?.user?.email,
        },
      });
      if (response.data.userGroup) {
        setUserGroups(response.data.userGroup);
      }
    } catch (err) {
      console.log(err)
      toast.error('Failed to fetch your groups');
    }
}, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserGroups();
    }
  }, [session, fetchUserGroups]);
  


  const handleApply = async (groupId: string) => {
    try {
      const response = await axios.post('/api/groups/apply', {
        groupId,
        userEmail: session?.user?.email,
      });
      console.log('Response: ', response);
      if (response.data.status === 400) {
        toast.error('You have already applied!');
      }
      if (response.status === 201) {
        toast.success('Application submitted successfully!');
      }
      if (response.data.status === 410) {
        toast.error('You are already part of this Group!');
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await axios.post('/api/groups/leave', {
        groupId,
        userEmail: session?.user?.email,
      });
      console.log('Leave: ', response);
      if (response.status === 200) {
        toast.success('Left group successfully!');
        revalidatePath('/groupCreation');
        fetchUserGroups();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    }
  };

  const fetchExistingGroups = async () => {
    setError('');

    try {
      const response = await axios.post('/api/groups', {
        body: {
          userEmail: session?.user?.email,
        },
      });
      console.log(response);
      setExistingGroups(response.data.groups);
      setShowExistingGroups(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  // const fetchUserGroups = async () => {
    
  // };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-20">
      <CardHeader>
        <CardTitle>Group Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {userGroups && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">My Groups</h3>
              <div key={userGroups.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-medium">{userGroups.name}</h3>
                  <p className="text-sm text-gray-500">Members: {userGroups._count.members}</p>
                </div>
                <Button variant="destructive" onClick={() => handleLeaveGroup(userGroups.id)}>
                  Leave Group
                </Button>
              </div>
            </div>
          )}

          <Button onClick={fetchExistingGroups} className="w-full">
            View Existing Groups
          </Button>

          {showExistingGroups && (
            <div className="space-y-4">
              {existingGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-gray-500">Members: {group._count.members}</p>
                    <p className="text-sm text-gray-500">Coordinator: {group.coordinator.username}</p>
                  </div>
                  {/* <Button variant="outline" onClick={() => handleApply(group.id)}>
                    Apply
                  </Button> */}
                </div>
              ))}
              {existingGroups.length === 0 && <p className="text-center text-gray-500">No groups found</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupManagement;