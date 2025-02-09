
'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
}

const AdminGroupCreator = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [coordinator, setCoordinator] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data } = await axios.post('/api/checkIfAdmin');
        console.log('Admin status:', data);
        setIsAdmin(data.isAdmin);
        if (data.isAdmin) {
          const usersResponse = await axios.post('/api/getUsersForAdmin');
          console.log('Users data:', usersResponse.data);
          if (Array.isArray(usersResponse.data.users)) {
            setUsers(usersResponse.data.users);
          } else {
            console.error('Users data is not an array:', usersResponse.data);
            setError('Invalid users data received');
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleCoordinatorSelect = (userId: string) => {
    setCoordinator(userId === coordinator ? null : userId);
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    if (!coordinator) {
      setError('Please select a coordinator');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/groups/create', {
        name: groupName.trim(),
        users: selectedUsers,
        coordinator
      });
      toast.success('Group created')
      setSuccess('Group created successfully');
      setSelectedUsers([]);
      setCoordinator(null);
      setGroupName('');
    } catch (err) {
      console.log(err)
      setError('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create / Update Group</CardTitle>
        <CardDescription>Select users and assign a coordinator to create a new group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Group Name</label>
          <Input
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Users</label>
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <ScrollArea className="h-64 border rounded-md p-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No users found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-2 rounded-md">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserSelect(user.id)}
                      id={`user-${user.id}`}
                    />
                    <label 
                      htmlFor={`user-${user.id}`}
                      className="flex-grow cursor-pointer"
                    >
                      {user.username}
                    </label>
                    <Button
                      variant={coordinator === user.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCoordinatorSelect(user.id)}
                    >
                      {coordinator === user.id ? "Coordinator ✓" : "Make Coordinator"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="mt-2 text-sm text-gray-500">
            Selected users: {selectedUsers.length}
            {coordinator && ` | Coordinator: ${users.find(u => u.id === coordinator)?.username}`}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Group
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminGroupCreator;