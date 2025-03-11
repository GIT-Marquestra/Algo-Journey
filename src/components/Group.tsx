'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trash2, Users, UserPlus, User, Info, 
  ChevronDown, ChevronRight, Search, AlertCircle, RefreshCw, Loader2 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Alert, AlertDescription } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@radix-ui/react-alert-dialog';
import { AlertDialogFooter, AlertDialogHeader } from './ui/alert-dialog';
import useStore from '@/store/store';
import { Skeleton } from './ui/skeleton';

interface User {
  id: string;
  username: string;
  email?: string;
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

const UnifiedGroupManagement = () => {
  // Session and admin status
  const { data: session } = useSession();
  const { isAdmin } = useStore()
  const [isLoading, setIsLoading] = useState(true);
  
  // Group management view state
  const [activeTab, setActiveTab] = useState<'create' | 'update'>('create');
  const [showExistingGroups, setShowExistingGroups] = useState(false);
  
  // Group data
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // User data 
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [coordinator, setCoordinator] = useState<string | null>(null);
  
  // Form inputs
  const [groupName, setGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Operation states
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingGroup, setIsFetchingGroup] = useState(false);
  const [groupFetched, setGroupFetched] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  // Check if user is admin and fetch initial data
  useEffect(() => {
    const initialize = async () => {
      try {
        
        const response = await axios.post('/api/checkIfCoordinator');
        setIsCoordinator(response.data.isCoordinator);
        let usersData: User[] = [];
        if (isAdmin) {
          const usersResponse = await axios.post('/api/getUsersForAdmin');
          if (Array.isArray(usersResponse.data.users)) {
            usersData = usersResponse.data.users;
            setUsers(usersData);
          }
        } else {
          const usersResponse = await axios.post('/api/getUsers');
          if (Array.isArray(usersResponse.data.users)) {
            usersData = usersResponse.data.users;
            setUsers(usersData);
          }
        }
        
        // Fetch user's current group
        if (session?.user?.email) {
          await fetchUserGroup();
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [session?.user?.email]);

  const fetchUserGroup = useCallback(async () => {
    try {
      const response = await axios.post('/api/groups', {
        body: {
          userEmail: session?.user?.email,
        },
      });
      
      if (response.data.userGroup) {
        setUserGroup(response.data.userGroup);
      } else {
        setUserGroup(null);
      }
    } catch (err) {
      console.error('Error fetching user group:', err);
      toast.error('Failed to fetch your group');
    }
  }, [session?.user?.email]);

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

  const fetchGroupMembers = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter an existing group name');
      return;
    }

    setIsFetchingGroup(true);
    
    try {
      const response = await axios.post('/api/getGroupMembersToUpdate', {
        groupName: groupName.trim()
      });

      const { data } = response;

      if (data.members && Array.isArray(data.members)) {
        setSelectedUsers(data.members.map((user: User) => user.id));
        
        // Merge members with existing users, avoiding duplicates
        setUsers(prevUsers => {
          const existingUserIds = new Set(prevUsers.map(user => user.id));
          const newUsers = data.members.filter((user: User) => !existingUserIds.has(user.id));
          return [...prevUsers, ...newUsers];
        });
        
        // Set coordinator if it exists in the response
        if (data.coordinator) {
          setCoordinator(data.coordinator);
        }
        
        setGroupFetched(true);
        toast.success('Group members loaded successfully');
      } else {
        toast.error('Failed to fetch group members');
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
      toast.error('Group not found or error fetching members');
    } finally {
      setIsFetchingGroup(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCoordinatorSelect = (userId: string) => {
    setCoordinator(userId === coordinator ? null : userId);
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setCoordinator(null);
    setGroupName('');
    setNewGroupName('');
    setSearchTerm('');
    setGroupFetched(false);
    setSelectedGroupId(null);
    setShowAddMembers(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await axios.post('/api/groups/join', {
        groupId,
        userEmail: session?.user?.email,
      });
      
      if (response.status === 200) {
        toast.success('Joined group successfully');
        fetchUserGroup();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to join group');
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
        fetchUserGroup();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to leave group');
    }
  };

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
        fetchExistingGroups();
        fetchUserGroup();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateOrUpdateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!coordinator && activeTab === 'create') {
      toast.error('Please select a coordinator');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post('/api/groups/create', {
        name: groupName.trim(),
        users: selectedUsers,
        newGroupName: activeTab === 'update' ? newGroupName.trim() : undefined,
        coordinator,
        mode: activeTab
      });
      
      toast.success(`Group ${activeTab === 'create' ? 'created' : 'updated'} successfully`);
      resetForm();
      setActiveTab('create');
      fetchExistingGroups();
      fetchUserGroup();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${activeTab} group`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroupId) {
      toast.error('No group selected');
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post('/api/groups/addMember', {
        groupId: selectedGroupId,
        userIds: selectedUsers
      });
      
      toast.success('Members added successfully');
      setSelectedUsers([]);
      setShowAddMembers(false);
      fetchExistingGroups();
    } catch (err) {
      console.error('Error adding members:', err);
      toast.error('Failed to add members');
      setError('Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMemberSelectionList = () => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        />
      </div>

      <ScrollArea className="h-96 border border-gray-200 rounded-md overflow-auto">
        <div className="p-4 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isSelected ? 'bg-indigo-50 border-indigo-100' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleUserSelect(user.id)}
                      id={`user-${user.id}`}
                      className={isSelected ? "border-indigo-600 text-indigo-600" : "border-gray-300"}
                    />
                    <label htmlFor={`user-${user.id}`} className="cursor-pointer flex items-center">
                      {user.username}
                      {coordinator === user.id && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          Coordinator
                        </span>
                      )}
                    </label>
                  </div>
                  {(
                    <button
                      className={`flex items-center px-2 py-1 rounded text-xs font-medium ml-2 ${
                        coordinator === user.id 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => handleCoordinatorSelect(user.id)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      {coordinator === user.id ? "Coordinator" : "Make Coordinator"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderAddMembersDialog = () => {
    const selectedGroup = existingGroups.find(g => g.id === selectedGroupId);
    
    return (
      <Card className="bg-white shadow-md border border-gray-100 w-full max-w-2xl mx-auto">
        <CardHeader className="bg-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <UserPlus className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-indigo-700">{selectedGroup?.name || 'Group'} - Add Members</CardTitle>
                <CardDescription className="text-gray-600">Select users to add to this group</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddMembers(false)}
              className="border-gray-200 hover:bg-gray-50"
            >
              Back to Groups
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {error && (
            <Alert className="bg-red-50 border-l-4 border-l-red-500 text-red-800">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {renderMemberSelectionList()}
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>Selected: {selectedUsers.length} users</div>
            </div>

            <Button 
              className={`w-full mt-6 ${
                selectedUsers.length === 0 
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              onClick={handleAddMembers}
              disabled={isSubmitting || selectedUsers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Members...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            
            {selectedUsers.length > 0 && (
              <div className="text-center mt-2">
                <button 
                  onClick={() => setSelectedUsers([])} 
                  className="text-sm text-gray-500 hover:text-indigo-600"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroupCreationForm = () => (
    <div className='max-w-3xl'>
      <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create' 
              ? 'bg-white text-indigo-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => {
            resetForm();
            setActiveTab('create');
          }}
        >
          Create Group
        </button>
        <button
          className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'update' 
              ? 'bg-white text-indigo-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => {
            resetForm();
            setActiveTab('update');
          }}
        >
          Update Group
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4">
          {/* Group name input */}
          <div>
            {activeTab === 'update' ? (
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  placeholder="Enter existing group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                <Button 
                  onClick={fetchGroupMembers} 
                  disabled={isFetchingGroup}
                  className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {isFetchingGroup ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin text-blue-500" />
                      <span>Loading</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Fetch Group</span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <Input
                type="text"
                placeholder="Enter new group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            )}
            
            {activeTab === 'update' && groupFetched && (
              <Input
                type="text"
                placeholder="Enter new group name (leave blank to keep current name)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            )}
          </div>

          {/* User selection */}
          {renderMemberSelectionList()}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>Selected: {selectedUsers.length} users</div>
            {coordinator && (
              <div>
                Coordinator: {users.find(u => u.id === coordinator)?.username}
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <Button 
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:bg-indigo-400"
          onClick={handleCreateOrUpdateGroup}
          disabled={isSubmitting || (activeTab === 'update' && !groupFetched)}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {activeTab === 'create' ? 'Creating...' : 'Updating...'}
            </div>
          ) : (
            activeTab === 'create' ? 'Create Group' : 'Update Group'
          )}
        </Button>
      </div>
    </div>
  );

  const renderGroupsList = () => (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-50 border-l-4 border-l-red-500 text-red-800">
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {userGroup ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            My Group
          </h3>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-amber-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                  {userGroup.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{userGroup.name}</h3>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-amber-100 rounded-full">
                <p className="text-xs font-medium text-amber-700">{userGroup._count.members} members</p>
              </div>
            </div>
            <div className="px-4 py-3 bg-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Points:</span> {userGroup.groupPoints || 0}
                </div>
              </div>
              <div className="flex gap-2">
              {isCoordinator && <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedGroupId(userGroup.id);
                  setSelectedUsers([]);
                  setShowAddMembers(true);
                }}
                className="border-gray-200 hover:bg-indigo-50 text-indigo-600 flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Add Members
              </Button>}
                <Button 
                  variant="outline" 
                  onClick={() => handleLeaveGroup(userGroup.id)}
                  className="border-gray-200 hover:bg-red-50 text-red-600"
                  size="sm"
                >
                  Leave Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
          <div className="px-4 py-4 text-center space-y-4">
            <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-amber-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Not in a group yet</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Join a team to collaborate with other developers, participate in team challenges, and climb the leaderboard together.
            </p>
          </div>
        </div>
      )}

      <div className="pt-4">
        <Button 
          onClick={fetchExistingGroups}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center gap-2"
        >
          <Users className="h-4 w-4" />
          {showExistingGroups ? 'Refresh Groups List' : 'View Existing Groups'}
          <ChevronDown className={`h-4 w-4 transition-transform ${showExistingGroups ? 'transform rotate-180' : ''}`} />
        </Button>
      </div>

      {showExistingGroups && (
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Available Groups
          </h3>
          
          {existingGroups.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-600 flex items-center justify-center gap-2">
                <Info className="h-4 w-4" />
                No groups found
              </p>
            </div>
          ) : (
            existingGroups.map((group) => (
              <div key={group.id} className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{group.name}</h3>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-100 rounded-full">
                    <p className="text-xs font-medium text-indigo-700">{group._count.members} members</p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Coordinator: <span className="font-medium">{group.coordinator.username}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!userGroup && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleJoinGroup(group.id)}
                        className="border-gray-200 hover:bg-indigo-50 text-indigo-600"
                      >
                        Join Group <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
  <>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-gray-200 hover:bg-red-50 text-red-600 flex items-center gap-2"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white p-0 overflow-hidden">
        <AlertDialogHeader className="bg-red-50 px-4 py-3 border-b border-gray-100">
          <AlertDialogTitle className="text-lg font-medium text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Delete Group
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            This action cannot be undone. All members will be removed from this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{group.name}</span>?
          </p>
          <AlertDialogFooter className="flex space-x-2 justify-end">
            <AlertDialogCancel className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteGroup(group.id)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded flex items-center"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete Group
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  </>
)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (isLoading ? (<Card className="max-w-6xl mx-auto shadow-md border border-gray-100 mt-20 animate-pulse">
    {/* Header Skeleton */}
    <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white">
      <div className="flex items-center">
        <div className="bg-white/20 p-2 rounded-full mr-3">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <CardTitle>
            <Skeleton className="w-40 h-6 bg-white/30 rounded-md" />
          </CardTitle>
          <CardDescription className="text-indigo-100">
            <Skeleton className="w-60 h-4 bg-white/30 rounded-md mt-1" />
          </CardDescription>
        </div>
      </div>
    </CardHeader>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Groups List Loader */}
      <CardContent className="col-span-1 md:col-span-2 p-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-12 bg-gray-200 rounded-md" />
          ))}
        </div>
      </CardContent>

      {/* Group Creation Form Loader (Only for Admins) */}
      <CardContent className="col-span-1 md:col-span-3 p-4">
        <div className="space-y-4">
          <Skeleton className="w-48 h-6 bg-gray-200 rounded-md" />
          <Skeleton className="w-full h-10 bg-gray-200 rounded-md" />
          <Skeleton className="w-32 h-10 bg-gray-300 rounded-md" />
        </div>
      </CardContent>
    </div>
  </Card>) :
    (<Card className="max-w-6xl mx-auto shadow-md border border-gray-100 mt-20">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white">
        <div className="flex items-center">
          <div className="bg-white/20 p-2 rounded-full mr-3">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Group Management</CardTitle>
            <CardDescription className="text-indigo-100">
              Create, join, and manage groups
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
      <CardContent className="col-span-1 md:col-span-2 p-4">
        {showAddMembers && selectedGroupId ? (
          renderAddMembersDialog()
        ) : (
          <>
          {renderGroupsList()}
          </>
        )}
      </CardContent>
      {isAdmin && <CardContent className='col-span-1 md:col-span-3 p-4'>
      {renderGroupCreationForm()}
      </CardContent>}
      </div>
    </Card>)
  );
};

export default UnifiedGroupManagement;