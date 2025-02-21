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
import Profile from '@/components/Profile';
import { useParams } from 'next/navigation';

type UserProfile = {
  username: string;
  email: string;
  leetcodeUsername: string | null;
  codeforcesUsername: string | null;
  section: string;
  enrollmentNum: string;
  profileUrl: string | null;
  individualPoints: number;
  oldPassword?: string;
  newPassword?: string;
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({
    username: "john_doe",
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
    if(!res.data.user) return 
    setProfile(res.data.user)
    if (Array.isArray(params.username)) return; // Prevents array-related issues

    const username = decodeURIComponent(params.username as string);

    if (res.data.user.username === username) {
      setIfCurrentUser(true);
    }
  }, [])

 

  useEffect(() => {
    getInitialDetails()
  }, [getInitialDetails])

  const [isEditing, setIsEditing] = useState(false);
  const params = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [ifCurrentUser, setIfCurrentUser] = useState(false)

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
      const dataToSend = { ...profile };
      
     
      if (profile.oldPassword && profile.newPassword) {
        dataToSend.oldPassword = profile.oldPassword;
        dataToSend.newPassword = profile.newPassword;
      } else {
        
        delete dataToSend.oldPassword;
        delete dataToSend.newPassword;
      }

      const res = await axios.patch('/api/user/updateProfile', {
        profile: dataToSend
      });

      if(res.status === 200){
        toast.success('Changes Saved, LogIn again!')
      }
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setShowPasswordFields(false);
      
      
      setProfile(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: ''
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Some Error Occurred')
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <>
    {ifCurrentUser && <div className="container mx-auto py-8 max-w-2xl mt-12">
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
            // <CurrentDetailsView />
            <Button onClick={() => setIsEditing(true)}>
                Edit Profile
            </Button>
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

                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                  >
                    {showPasswordFields ? "Hide Password Fields" : "Change Password"}
                  </Button>
                </div>

                {showPasswordFields && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="oldPassword">Current Password</Label>
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type="password"
                        value={profile.oldPassword || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={profile.newPassword || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your new password"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setSuccessMessage("");
                    setShowPasswordFields(false);
                    setProfile(prev => ({
                      ...prev,
                      oldPassword: '',
                      newPassword: ''
                    }));
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
    </div>}
      <Profile/>
      
    </>
  );
};

export default ProfilePage;