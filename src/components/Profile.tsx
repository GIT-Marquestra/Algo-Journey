'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  ExternalLink,
  Users,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  GitBranch
} from 'lucide-react';

type ProfileData = {
  user: {
    username: string;
    email: string;
    leetcodeUsername: string;
    codeforcesUsername: string;
    section: string;
    enrollmentNum: string;
    individualPoints: number;
    profileUrl?: string;
    group?: {
      name: string;
      groupPoints: number;
      coordinator: {
        username: string;
      };
    };
    submissions: Array<{
      id: string;
      score: number;
      status: string;
      createdAt: Date;
      question: {
        leetcodeUrl?: string;
        codeforcesUrl?: string;
        difficulty: string;
        points: number;
        slug: string;
      };
    }>;
  };
};

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    BEGINNER: 'bg-slate-100 text-slate-700',
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700',
    VERYHARD: 'bg-purple-100 text-purple-700'
  };
  return colors[difficulty as keyof typeof colors] || colors.BEGINNER;
};

const getStatusColor = (status: string) => {
  const colors = {
    ACCEPTED: 'text-green-600',
    WRONG_ANSWER: 'text-red-600',
    TIME_LIMIT_EXCEEDED: 'text-yellow-600',
    MEMORY_LIMIT_EXCEEDED: 'text-orange-600',
    RUNTIME_ERROR: 'text-red-600',
    COMPILATION_ERROR: 'text-purple-600',
    PENDING: 'text-blue-600'
  };
  return colors[status as keyof typeof colors] || 'text-slate-600';
};

export default function Profile() {
  const params = useParams();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/api/getProfileDetails/${params.username}`);
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.username]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profileData) {
    return <div className="flex items-center justify-center min-h-screen">Profile not found</div>;
  }

  const { user } = profileData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="md:col-span-1 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">{user.section} • {user.enrollmentNum}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-slate-600">Individual Points: {user.individualPoints}</span>
              </div>
              {user.group && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{user.group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-slate-600">Group Points: {user.group.groupPoints}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <GitBranch className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Coordinator: {user.group.coordinator.username}</span>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Platform Usernames</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">LeetCode: {user.leetcodeUsername}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">CodeForces: {user.codeforcesUsername}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Recent Submissions</h2>
          {user.submissions.map((submission, index) => (
            <Card key={submission.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {submission.question.slug}
                    </CardTitle>
                    <Badge variant="secondary" className={getStatusColor(submission.status)}>
                      {submission.status === 'ACCEPTED' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className={getDifficultyColor(submission.question.difficulty)}>
                    {submission.question.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-slate-600">
                        Points: {submission.question.points}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link 
                    href={submission.question.leetcodeUrl || submission.question.codeforcesUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      View Question <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}