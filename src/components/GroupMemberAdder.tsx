'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
}

interface GroupMemberAdderProps {
  groupId: string;
  groupName: string;
}

const GroupMemberAdder = ({ groupId, groupName }: GroupMemberAdderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const usersResponse = await axios.post('/api/getUsers');
        if (Array.isArray(usersResponse.data.users)) {
          setUsers(usersResponse.data.users);
        } else {
          console.error('Users data is not an array:', usersResponse.data);
          setError('Invalid users data received');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch users');
        toast.error('Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableUsers();
  }, []);

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post('/api/groups/addMember', {
        groupId,
        userIds: selectedUsers
      });
      
      toast.success('Members added successfully');
      setSelectedUsers([]);
    } catch (err) {
      console.error('Error adding members:', err);
      toast.error('Failed to add members');
      setError('Failed to add members');
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Members to {groupName}</CardTitle>
        <CardDescription>Select users to add to the group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              <div className="text-center py-4 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-accent">
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
                    {selectedUsers.includes(user.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Selected users: {selectedUsers.length}
          </div>

          <Button 
            className="w-full mt-4"
            onClick={handleAddMembers}
            disabled={isSubmitting || selectedUsers.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Members...
              </>
            ) : (
              'Add Selected Members'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMemberAdder;