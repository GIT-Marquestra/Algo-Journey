'use client'
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Users, 
  Trophy, 
  Swords, 
  LogOut, 
  UserCircle,
  ShieldCheck,
  ChartNoAxesColumnIcon,
  UserCog, 
  LucideSword
} from 'lucide-react';

const Navbar = () => {
  const router = useRouter();
  const { status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  
  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const [adminResponse, usernameResponse] = await Promise.all([
          axios.post('/api/checkIfAdmin'),
          axios.post('/api/getUsername')
        ]);
        
        setUsername(usernameResponse.data.username);
        setIsAdmin(adminResponse.data.isAdmin);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (status === 'authenticated') {
      checkIfAdmin();
    }
  }, [status]);

  const navigationItems = [
    { href: '/user/dashboard', label: 'Home', icon: Home },
    { href: '/groupCreation', label: 'Teams', icon: Users },
    { href: '/leaderboard/user', label: 'Leaderboard', icon: Trophy },
    { href: '/arena', label: 'Arena', icon: Swords },
    { href: '/contestsPage', label: 'Contests', icon: LucideSword}
  ];

  const handleSignOut = async (e: Event) => {
    e.preventDefault();
    try {
      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-4 md:px-8 border-b shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-4">
        <Link href={'/'}>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          AlgoJourney
        </span>
        </Link>
      </div>

      {status === 'authenticated' ? (
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="flex items-center space-x-1">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Hi, {username}</p>
                    <p className="text-xs text-muted-foreground">Logged in</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="md:hidden">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  <DropdownMenuSeparator />
                </div>

                {isAdmin && (
                  <>
                  <Link href="/admin/dashboard">
                    <DropdownMenuItem>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/Stats">
                    <DropdownMenuItem>
                      <ChartNoAxesColumnIcon className="mr-2 h-4 w-4" />
                      <span>Stats</span>
                    </DropdownMenuItem>
                  </Link>
                  </>
                )}
                
                <DropdownMenuItem onSelect={(e) => handleSignOut(e)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserCog className="mr-2 h-4 w-4"/>
                  <Link href={`/user/updateProfile/${username}`}><span>Update Profile</span></Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
        </div>
      ) : (

        <Button variant="default" onClick={() => signIn()} className="flex items-center space-x-2">
          <UserCircle className="h-4 w-4" />
          <span>Sign In</span>
        </Button>

      )}
    </nav>
  );
};

export default Navbar;