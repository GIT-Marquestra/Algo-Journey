'use client'
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Code2, Users, Trophy, Brain, CheckCircle, ExternalLink, Sparkles } from "lucide-react";
import Link from 'next/link';
import { useSession } from 'next-auth/react';


const HeroSection = () => {
  const { data: session } = useSession()
  return (
    <div className="relative min-h-screen">
      {/* Enhanced gradient background with subtle color mix */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5 -z-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
      
      {/* Hero Content */}
      <div className="container mx-auto px-4 pt-20 pb-16 relative">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="px-4 py-1 mb-4 bg-primary/10 hover:bg-primary/20 transition-colors">
            <Sparkles className="w-4 h-4 mr-2 inline-block" />
            Beta Access Now Open
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Master DSA
            <span className="text-primary block mt-2 bg-clip-text bg-gradient-to-r from-primary to-primary/80">Together</span>
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Track your progress, compete with friends, and improve your coding skills with our integrated platform for LeetCode and Codeforces practice.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {!session && <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" asChild>
              <Link href="/auth/signup">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>}
          </div>
        </div>

        {/* Features Grid with hover effects */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          <Card className="bg-background/60 backdrop-blur border-primary/10 hover:border-primary/20 transition-colors duration-300 hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-lg p-3 bg-green-500/10 w-fit transition-transform hover:scale-105">
                <Trophy className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-xl mt-4">Competitive Environment</h3>
              <p className="text-muted-foreground mt-2">
                Participate in timed contests, track your progress, and compete with peers in a focused environment.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/60 backdrop-blur border-primary/10 hover:border-primary/20 transition-colors duration-300 hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-lg p-3 bg-yellow-500/10 w-fit transition-transform hover:scale-105">
                <Users className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-xl mt-4">Group Practice</h3>
              <p className="text-muted-foreground mt-2">
                Form groups, practice together, and track group progress with integrated leaderboards.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/60 backdrop-blur border-primary/10 hover:border-primary/20 transition-colors duration-300 hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-lg p-3 bg-red-500/10 w-fit transition-transform hover:scale-105">
                <Code2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-xl mt-4">Platform Integration</h3>
              <p className="text-muted-foreground mt-2">
                Seamlessly connect with LeetCode and CodeForces to verify submissions and track progress.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section with enhanced styling */}
        <div className="mt-24 text-center relative p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-yellow-500/5 to-red-500/5 rounded-xl -z-10" />
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 group">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-xl">Connect Accounts</h3>
              <p className="text-muted-foreground">
                Link your LeetCode and CodeForces accounts to start tracking your progress.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-xl">Practice & Compete</h3>
              <p className="text-muted-foreground">
                Solve problems in our tracked environment and participate in group contests.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-xl">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your improvement and compare with peers on the leaderboard.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Links with enhanced buttons */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-8">Supported Platforms</h2>
          <div className="flex justify-center gap-6">
            <Link href="https://leetcode.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2 hover:bg-yellow-500/10 hover:text-yellow-500 transition-colors">
                LeetCode <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://codeforces.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                CodeForces <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* CTA Section with gradient background */}
        <div className="mt-24 text-center rounded-lg p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-yellow-500/10 to-red-500/10 group-hover:opacity-75 transition-opacity" />
          <h2 className="text-3xl font-bold mb-4 relative">Ready to Level Up?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto relative">
            Join our community of competitive programmers and start improving your skills today.
          </p>
          {!session && <Button size="lg" className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" asChild>
            <Link href="/auth/signup">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;