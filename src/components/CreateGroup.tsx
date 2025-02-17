'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';

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

const GroupManagement = ({isAdmin}:{isAdmin:boolean}) => {
  const [showExistingGroups, setShowExistingGroups] = useState(false);
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [userGroups, setUserGroups] = useState<Group>();
  const [isDeleting, setIsDeleting] = useState(false);
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
      console.error(err);
      toast.error('Failed to fetch your groups');
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserGroups();
    }
  }, [session, fetchUserGroups]);

  const handleDeleteGroup = async (groupId: string) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete groups");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.post('/api/groups/delete', {
        groupId
      });
      
      if (response.status === 200) {
        toast.success('Group deleted successfully');
        // Refresh the groups list
        fetchExistingGroups();
        fetchUserGroups();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await axios.post('/api/groups/leave', {
        groupId,
        userEmail: session?.user?.email,
      });
      if (response.status === 200) {
        toast.success('Left group successfully');
        fetchUserGroups();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to leave group');
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
      setExistingGroups(response.data.groups);
      setShowExistingGroups(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const DeleteGroupDialog = ({ group }: { group: Group }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="flex items-center gap-2"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Group</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the group &quot;{group.name}&quot;? This action cannot be undone.
            All members will be removed and all associated data will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleDeleteGroup(group.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

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
                <Button 
                  variant="destructive" 
                  onClick={() => handleLeaveGroup(userGroups.id)}
                  className="flex items-center gap-2"
                >
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
                  <div className="flex-1">
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-gray-500">Members: {group._count.members}</p>
                    <p className="text-sm text-gray-500">Coordinator: {group.coordinator.username}</p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && <DeleteGroupDialog group={group} />}
                  </div>
                </div>
              ))}
              {existingGroups.length === 0 && (
                <p className="text-center text-gray-500">No groups found</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupManagement;