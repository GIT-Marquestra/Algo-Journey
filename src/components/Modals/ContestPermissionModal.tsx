'use client'
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import toast from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
}

interface ContestPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTest: (selectedGroups: string[]) => Promise<number>;
}

export default function ContestPermissionModal({
  isOpen,
  onClose,
  onCreateTest
}: ContestPermissionModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.post('/api/getGroups');
      setGroups(response.data.groups);
      console.log(response.data.groups)
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setIsAllSelected(checked);
    if (checked) {
      setSelectedGroups([]);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      }
      return [...prev, groupId];
    });
    setIsAllSelected(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const contestId = await onCreateTest(selectedGroups);
      
      const response = await axios.post('/api/setPermissionForGroup', {
        contestId,
        groups: isAllSelected ? [] : selectedGroups,
        isAllSelected
      });

      if(!(response.status === 200)){
        toast.error(response.data.message);
        return;
      }
      toast.success('Test created with permissions');
      onClose();
    } catch (error) {
      console.error('Error creating test with permissions:', error);
      toast.error('Failed to create test with permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForCoordinators = async () => {
    setLoading(true);
    try {
      const contestId = await onCreateTest([]);
      
      const response = await axios.post('/api/setPermissionForCoordinators', {
        contestId
      });

      if(!(response.status === 200)){
        toast.error(response.data.message);
        return;
      }
      toast.success('Test created for coordinators');
      onClose();
    } catch (error) {
      console.error('Error creating test for coordinators:', error);
      toast.error('Failed to create test for coordinators');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Test For</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-groups"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="all-groups">All Groups</Label>
          </div>
          
          {!isAllSelected && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}

                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => handleGroupSelect(group.id)}
                  />
                  <Label htmlFor={group.id}>{group.name}</Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={loading || (!isAllSelected && selectedGroups.length === 0)}
          >
            {loading ? "Creating..." : "Create Test"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCreateForCoordinators}
            disabled={loading}
          >
            Create For Coordinators
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}