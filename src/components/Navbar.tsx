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
  Brain,
  Swords, 
  Info,
  LogOut, 
  Settings,
  ShieldCheck,
  ChartNoAxesColumnIcon,
  UserCog, 
  LucideSword
} from 'lucide-react';
import useStore from '@/store/store';
import useTagStore from '@/store/tagsStore';

const Navbar = () => {
  const router = useRouter();
  const { status } = useSession();
  const { isAdmin, setIsAdmin } = useStore();
  const [username, setUsername] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const { setTags } = useTagStore()

  
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
  }, [status, setIsAdmin]);
  const fn = async () => {
    const res = await axios.get('api/getTags')
    console.log(res)
    //@ts-expect-error: not needed here.
    const tags = res.data.map((p) => p.name)
    setTags(tags)
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('githubAccessToken')
    if(accessToken){
      setToken(accessToken)
    }
    fn()
  }, []);


  const navigationItems = [
    { href: '/user/dashboard', label: 'Home', icon: Home, color: 'text-indigo-500' },
    { href: '/groupCreation', label: 'Teams', icon: Users, color: 'text-amber-500' },
    { href: '/leaderboard/user', label: 'Leaderboard', icon: Trophy, color: 'text-teal-500' },
    { href: '/arena', label: 'Arena', icon: Swords, color: 'text-rose-500' },
    { href: '/contestsPage', label: 'Contests', icon: LucideSword, color: 'text-blue-500' }
  ];

  const handleSignOut = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-4 md:px-8 border-b shadow-sm bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center space-x-4">
        <Link href={'/'}>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
            AlgoJourney
          </span>
        </Link>
      </div>

      {status === 'authenticated' ? (
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="flex items-center space-x-1 hover:bg-gray-50">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50 flex items-center gap-2 px-3">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium">
                    {username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-100 shadow-lg rounded-lg p-1">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-gray-800">Hi, {username}</p>
                    <p className="text-xs text-gray-500">Logged in</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100" />
                
                <div className="md:hidden py-1">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                        <span className="text-gray-700">{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  <DropdownMenuSeparator className="bg-gray-100" />
                </div>

                {isAdmin && (
                  <>
                    <Link href="/admin/dashboard">
                      <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />
                        <span className="text-gray-700">Admin Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/Stats">
                      <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <ChartNoAxesColumnIcon className="mr-2 h-4 w-4 text-teal-500" />
                        <span className="text-gray-700">Stats</span>
                      </DropdownMenuItem>
                    </Link>
                   
                    <DropdownMenuSeparator className="bg-gray-100" />
                  </>
                )}
                 <Link href={token ? '/chat/true' : '/chat/false'}>
                      <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <Brain className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-gray-700">Chat/Rate with Gemini</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href='/about'>
                      <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <Info className="mr-2 h-4 w-4 text-blue-500" />
                        <span className="text-gray-700">About AlgoJourney</span>
                      </DropdownMenuItem>
                    </Link>
                
                <Link href={`/user/updateProfile/${username}`}>
                  <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <UserCog className="mr-2 h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Profile</span>
                  </DropdownMenuItem>
                </Link>
                
                <DropdownMenuItem 
                  className="px-3 py-2 hover:bg-rose-50 cursor-pointer" 
                  //@ts-expect-error: don't know what to do here
                  onSelect={(e) => handleSignOut(e)}
                >
                  <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                  <span className="text-rose-600 font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        <Button 
          variant="default" 
          onClick={() => signIn()} 
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm transition-all flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Sign In</span>
        </Button>
      )}
    </nav>
  );
};

export default Navbar;