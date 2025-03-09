'use client'
import React, { useEffect, useState } from 'react'
import { Loader2, Search, Users, UserPlus, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import toast from 'react-hot-toast'
import axios from 'axios'

interface User {
  id: string
  username: string
}

const AdminGroupCreator = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [coordinator, setCoordinator] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [mode, setMode] = useState<'create' | 'update'>('create')
  const [newGroupName, setNewGroupName] = useState('')
  const [isFetchingGroup, setIsFetchingGroup] = useState(false)
  const [groupFetched, setGroupFetched] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data } = await axios.post('/api/checkIfAdmin')
        setIsAdmin(data.isAdmin)
        if (data.isAdmin) {
          const usersResponse = await axios.post('/api/getUsersForAdmin')
          if (Array.isArray(usersResponse.data.users)) {
            setUsers(usersResponse.data.users)
          } 
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  const fetchGroupMembers = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter an existing group name')
      return
    }

    setIsFetchingGroup(true)
    
    try {
      const response = await axios.post('/api/getGroupMembersToUpdate', {
        groupName: groupName.trim()
      })

      const { data } = response

      if (data.members && Array.isArray(data.members)) {
        setSelectedUsers(data.members.map((user: User) => user.id))
        
        // Merge members with existing users, avoiding duplicates
        setUsers(prevUsers => {
          const existingUserIds = new Set(prevUsers.map(user => user.id))
          const newUsers = data.members.filter((user: User) => !existingUserIds.has(user.id))
          return [...prevUsers, ...newUsers]
        })
        
        // Set coordinator if it exists in the response
        if (data.coordinator) {
          setCoordinator(data.coordinator)
        }
        
        setGroupFetched(true)
        toast.success('Group members loaded successfully')
      } else {
        toast.error('Failed to fetch group members')
      }
    } catch (err) {
      console.error('Error fetching group members:', err)
      toast.error('Group not found or error fetching members')
    } finally {
      setIsFetchingGroup(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCoordinatorSelect = (userId: string) => {
    setCoordinator(userId === coordinator ? null : userId)
  }

  const resetForm = () => {
    setSelectedUsers([])
    setCoordinator(null)
    setGroupName('')
    setNewGroupName('')
    setSearchTerm('')
    setGroupFetched(false)
  }

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (!coordinator && mode === 'create') {
      toast.error('Please select a coordinator')
      return
    }

    setIsSubmitting(true)

    try {
      await axios.post('/api/groups/create', {
        name: groupName.trim(),
        users: selectedUsers,
        newGroupName: mode === 'update' ? newGroupName.trim() : undefined,
        coordinator,
        mode
      })
      toast.success(`Group ${mode === 'create' ? 'created' : 'updated'} successfully`)
      resetForm()
    } catch (err) {
      console.error(err)
      toast.error(`Failed to ${mode} group`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModeChange = (value: string) => {
    setMode(value as 'create' | 'update')
    resetForm()
  }

  // Fix: Properly filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="space-y-6" onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New Group</TabsTrigger>
            <TabsTrigger value="update">Update Existing Group</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                {mode === 'update' ? (
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Enter existing group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={fetchGroupMembers} 
                      disabled={isFetchingGroup}
                      variant="secondary"
                    >
                      {isFetchingGroup ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Fetch Group
                    </Button>
                  </div>
                ) : (
                  <Input
                    placeholder="Enter new group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mb-2"
                  />
                )}
                
                {mode === 'update' && groupFetched && (
                  <Input
                    placeholder="Enter new group name (leave blank to keep current name)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <ScrollArea className="h-[400px] border rounded-md">
                  <div className="p-4 space-y-2">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.id} 
                          className={`flex items-center justify-between p-2 rounded-lg border ${
                            selectedUsers.includes(user.id) ? 'bg-secondary/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleUserSelect(user.id)}
                              id={`user-${user.id}`}
                            />
                            <label htmlFor={`user-${user.id}`} className="cursor-pointer">
                              {user.username}
                              {coordinator === user.id && (
                                <Badge variant="secondary" className="ml-2">
                                  Coordinator
                                </Badge>
                              )}
                            </label>
                          </div>
                          <Button
                            variant={coordinator === user.id ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => handleCoordinatorSelect(user.id)}
                            className="ml-2"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {coordinator === user.id ? "Coordinator" : "Make Coordinator"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>Selected: {selectedUsers.length} users</div>
                  {coordinator && (
                    <div>
                      Coordinator: {users.find(u => u.id === coordinator)?.username}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || (mode === 'update' && !groupFetched)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Group' : 'Update Group'}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AdminGroupCreator