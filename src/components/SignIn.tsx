"use client"
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import img3 from '@/images/signin.png'
import Image from 'next/image'

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const Router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false 
      });

      
      if (!result) {
        toast.error('Please check credentials, and try again.');
        return;
      }
      
      if (result.error) {
        toast.error('Please check credentials, and try again.');
        return;
      }

      if(result.url) {
        toast.success('Signed In Successfully');
        setTimeout(()=>{
          Router.push('/user/dashboard');
        }, 1000)
      }

      
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/user/dashboard' });
    } catch (error) {
      console.error(error);
      toast.error('SignIn with Google failed, Try again!');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center mx-6 min-h-screen p-10">
      <div>
        <Image
          src={img3}
          alt="Login Page"
          width={700}
          height={700}
        />
      </div>
      <Card className="w-full max-w-md mx-16">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="w-6 h-6" />
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 m-2">
                <User className="w-4 h-4" /> Username
              </Label>
              <Input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 m-2">
                <Lock className="w-4 h-4" /> Password
              </Label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className='flex justify-center'>OR</div>       
            <Button 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'SignUp/SignIn with Google'}
            </Button>      
          </form>
        </CardContent>
      </Card>
      <Toaster/>
    </div>
  );
}