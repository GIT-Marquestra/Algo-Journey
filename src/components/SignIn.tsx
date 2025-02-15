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
  const Router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: true,
        callbackUrl: '/user/dashboard'
      });
      console.log(result)
      if(result?.status === 302){
        toast.error('Sign in Failed, check your credentials')
      } 
      else if(result?.status === 200){
        toast.success('Signed in with status 200')
        Router.push('/user/dashboard')
      }
      else {
        toast.success('Signed In')
        Router.push('/user/dashboard')
      }
    } catch (error) {
      console.log(error)
      toast.error("An error occurred during sign-in.");
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
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In if already Signed Up
            </Button>
            <div className='flex justify-center'>OR</div>       
            <Button className="w-full" onClick={ async ()=>{
              try {
              await signIn('google')
              } catch (error) {
                console.log(error)
                toast.error('SignIn with google failed, Try again!')  
              }

            }}>
              SignUp/SignIn with Google
            </Button>      
          </form>
        </CardContent>
      </Card>
      <Toaster/>
    </div>
  );
}