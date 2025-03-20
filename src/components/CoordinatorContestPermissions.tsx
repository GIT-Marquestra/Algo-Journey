'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import useStore from '@/store/store';

interface TeamMember {
  id: string;
  username: string;
  email: string;
  isCoordinator: boolean;
}

export default function CoordinatorContestPermissions({ contestId }: { contestId: number | undefined }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const Router = useRouter();
  const { isAdmin } = useStore()

  // Calculate if all non-coordinator members are selected
  const nonCoordinatorMembers = members.filter(member => !member.isCoordinator);
  const isAllSelected = nonCoordinatorMembers.length > 0 && 
    nonCoordinatorMembers.every(member => selectedMembers.includes(member.id));

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(`/api/getGroupMembers`);
        if (!response.data.members) {
          return toast.error('Failed to load team members');
        }

        setMembers(response.data.members);
        
        const coordinator = response.data.members.find((member: TeamMember) => member.isCoordinator);
        if (coordinator) {
          setSelectedMembers([coordinator.id]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to load team members');
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Get coordinator ID if exists
      const coordinatorId = members.find(m => m.isCoordinator)?.id;
      
      // Select all members
      const allMemberIds = members.map(member => member.id);
      
      // If there's a coordinator, ensure they stay selected
      setSelectedMembers(coordinatorId ? 
        Array.from(new Set([...allMemberIds])) : 
        allMemberIds
      );
    } else {
      // When deselecting all, keep only coordinator selected if they exist
      const coordinator = members.find(m => m.isCoordinator);
      setSelectedMembers(coordinator ? [coordinator.id] : []);
    }
  };

  const handleCheckboxChange = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      const member = members.find(m => m.id === memberId);
      if (member?.isCoordinator) {
        return;
      }
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post('/api/startContestForMembers', {
        contestId,
        memberIds: selectedMembers,
        isAdmin
      });

      if(response.status === 440){
        toast.error(response.data.message);
        return;
      }

      if (!response.data.success) {
        throw new Error('Failed to update contest permissions');
      }

      if(response.status === 409) {
        return toast.error(response.data.error);
      }

      toast.success('Contest permissions updated successfully');

    } catch (error: unknown) {
      console.error('Error updating contest permissions:', error);
      if (error && typeof error === 'object') {
        if ('status' in error && error.status === 440) {
          if ('response' in error && 
              error.response && 
              typeof error.response === 'object' &&
              'data' in error.response &&
              error.response.data &&
              typeof error.response.data === 'object' &&
              'message' in error.response.data &&
              typeof error.response.data.message === 'string'
          ) {
            toast.error(error.response.data.message);
            setTimeout(() => {
              Router.push('/user/dashboard');
            }, 1000);
          }
        } else {
          toast.error('Failed to grant permissions');
        }
      } else {
        toast.error('Failed to grant permissions');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-20">
      <CardHeader>
        <CardTitle className="text-2xl">Manage Contest Permissions</CardTitle>
        <CardDescription>
          Select which team members can start the contest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 border-b">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All Members
            </label>
          </div>

          {/* Individual Member Checkboxes */}
          {members.map((member) => (
            <div key={member.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
              <Checkbox
                id={member.id}
                checked={selectedMembers.includes(member.id)}
                onCheckedChange={(checked) => 
                  handleCheckboxChange(member.id, checked as boolean)
                }
                disabled={member.isCoordinator}
              />
              <label
                htmlFor={member.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex justify-between w-full"
              >
                <div>
                  <div>{member.username}</div>
                  <div className="text-muted-foreground text-xs">{member.email}</div>
                </div>
                {member.isCoordinator && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Coordinator
                  </span>
                )}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Allow Selected Members to Start Contest'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}