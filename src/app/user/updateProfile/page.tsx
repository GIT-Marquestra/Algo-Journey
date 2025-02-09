'use client'
import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from 'axios';
import toast from 'react-hot-toast';

type UserProfile = {
  username: string;
  email: string;
  leetcodeUsername: string | null;
  codeforcesUsername: string | null;
  section: string;
  enrollmentNum: string;
  profileUrl: string | null;
  individualPoints: number;
};

const ProfilePage = () => {
  // Mock initial data - replace with actual user data fetch
  const [profile, setProfile] = useState<UserProfile>({
    username: "john_doe",  // Example data
    email: "john@example.com",
    leetcodeUsername: "leetcoder123",
    codeforcesUsername: "coder456",
    section: "A1",
    enrollmentNum: "2021CS1234",
    profileUrl: "https://example.com/profile",
    individualPoints: 150
  });

  const getInitialDetails = useCallback(async() => {
    const res = await axios.get('/api/user/getDetails')
    console.log(res)
    if(!res.data.user) return 
    setProfile(res.data.user)
  }, [])

  useEffect(() => {

    getInitialDetails()

  }, [getInitialDetails])

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await axios.patch('/api/user/updateProfile', {
        profile
      })
      console.log(res)
      if(res.status === 200){
        toast.success('Changes Saved, LogIn again!')
      }
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Some Error Occured')
    } finally {
      setIsSaving(false);
    }
  };

  // Current Details View Component
  const CurrentDetailsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Username</h3>
          <p className="mt-1">{profile.username}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
          <p className="mt-1">{profile.email}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">LeetCode Username</h3>
          <p className="mt-1">{profile.leetcodeUsername || "Not set"}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">CodeForces Username</h3>
          <p className="mt-1">{profile.codeforcesUsername || "Not set"}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Section</h3>
          <p className="mt-1">{profile.section}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Enrollment Number</h3>
          <p className="mt-1">{profile.enrollmentNum}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Profile URL</h3>
          <p className="mt-1">{profile.profileUrl || "Not set"}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Individual Points</h3>
          <p className="mt-1">{profile.individualPoints}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setIsEditing(true)}>
          Edit Profile
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 max-w-2xl mt-12">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>View and update your profile information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <Alert className="mb-6 bg-green-50">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          
          {!isEditing ? (
            <CurrentDetailsView />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="leetcodeUsername">LeetCode Username</Label>
                  <Input
                    id="leetcodeUsername"
                    name="leetcodeUsername"
                    value={profile.leetcodeUsername || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your LeetCode username"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="codeforcesUsername">CodeForces Username</Label>
                  <Input
                    id="codeforcesUsername"
                    name="codeforcesUsername"
                    value={profile.codeforcesUsername || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your CodeForces username"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="section">Section</Label>
                  <Select 
                    value={profile.section}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, section: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="enrollmentNum">Enrollment Number</Label>
                  <Input
                    id="enrollmentNum"
                    name="enrollmentNum"
                    value={profile.enrollmentNum}
                    onChange={handleInputChange}
                    placeholder="Enter your enrollment number"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profileUrl">Profile URL</Label>
                  <Input
                    id="profileUrl"
                    name="profileUrl"
                    value={profile.profileUrl || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your profile URL"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Individual Points</Label>
                  <Input
                    value={profile.individualPoints}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setSuccessMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;