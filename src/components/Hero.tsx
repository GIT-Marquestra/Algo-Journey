'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import img1 from '@/images/landing.jpg'
import { ArrowRight, ChevronDown, ChevronUp, Code, Database, Layout, Linkedin, Star, Award, BarChart3, BookOpen, LogIn } from "lucide-react";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TextGenerateEffect } from './ui/text-generate-effect';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const sentence = "We are dedicated to providing an exceptional learning experience."
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-b from-white via-white to-gray-50 relative w-screen h-auto flex flex-col items-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-indigo-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main content with z-index */}
      <div className="relative z-10 w-full">
        {/* Hero Title */}
        <motion.h1 
          className="text-black text-6xl md:text-8xl lg:text-9xl font-mono text-center pt-32 md:pt-56 tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome
        </motion.h1>
        
        <motion.h1 
          className="text-black text-4xl z-40 md:text-6xl lg:text-7xl font-mono text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          to AlgoJourney
        </motion.h1>

        {/* CTA Button */}
        <motion.div 
          className="flex flex-col md:flex-row w-full justify-center items-center gap-4 pt-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {!session && (
            <>
              <Button
                size="lg"
                className="animate-[buttonPulse_360s_infinite_linear] w-40 md:w-48 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link href="/auth/signin" className="text-white flex items-center">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5 text-white" />
                </Link>
              </Button>
              
              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-40 md:w-48 border-blue-300 hover:bg-blue-50 shadow-md transition-all duration-300"
                  asChild
                >
                  <Link href="/auth/signin?demo=true" className="text-blue-600 flex items-center">
                    Try Demo <LogIn className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-gray-500 mt-2">Demo credentials: Username: Visitor, Password: Visitor1234</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Image Section - Kept intact as requested */}
        <div className="w-full flex justify-center pt-10">
          <Image
            src={img1}
            alt="Landing Page"
            width={1200}
            height={500}
            className="w-[90%] md:w-[80%] lg:w-[70%] h-auto rounded-xl"
          />
        </div>

        {/* Demo Account Info Box */}
        <motion.div 
          className="max-w-lg mx-auto my-10 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-semibold text-blue-700 mb-2">Try Without Registration</h3>
          <p className="text-gray-700 mb-4">Want to explore AlgoJourney without creating an account? Use our demo account:</p>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Username:</span>
              <code className="bg-gray-100 px-2 py-1 rounded-md text-blue-700">Visitor</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Password:</span>
              <code className="bg-gray-100 px-2 py-1 rounded-md text-blue-700">Visitor1234</code>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Note: This is a read-only account with limited functionality.</p>
        </motion.div>

        {/* Features Section */}
        <div className="max-w-6xl w-full px-4 md:px-8 py-16 mx-auto">
          <motion.h1 
            className="text-black font-bold text-3xl md:text-4xl text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="relative inline-block">
              Key Features
              <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600 transform scale-x-0 transition-transform group-hover:scale-x-100"></span>
            </span>
          </motion.h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {[
              {
                icon: <Star className="h-6 w-6 text-blue-500" />,
                title: "Weekly Coding Contests",
                description: "Compete, rank up, and sharpen your problem-solving skills.",
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-indigo-500" />,
                title: "Interactive Progress Tracker",
                description: "See how many problems you've solved and track your growth.",
              },
              {
                icon: <Award className="h-6 w-6 text-blue-500" />,
                title: "Competitive Leaderboard",
                description: "Rank yourself among peers in weekly & monthly contests.",
              },
              {
                icon: <BookOpen className="h-6 w-6 text-indigo-500" />,
                title: "Topic-Wise Practice",
                description: "Solve handpicked problems to master Data Structures & Algorithms.",
              },
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start">
                  <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-black font-extrabold text-xl group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h2>
                    <p className="text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-32 md:mt-48"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-gray-800 text-4xl md:text-5xl lg:text-6xl font-semibold">
              On Algojourney
            </h2>
            <div className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 inline-block">
              <p className="text-gray-700 text-lg md:text-2xl lg:text-3xl">
                <TextGenerateEffect words={sentence}/>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer Section */}
        <footer className="bg-gradient-to-r from-gray-900 to-slate-900 text-white py-8 w-full mt-16 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="space-y-2"
            >
              <div className="flex items-center justify-center space-x-4 pb-4">
                <h4 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Meet Our Contributors</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0 bg-gray-800 hover:bg-gray-700">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-white" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contributor Cards */}
                  {[
                    {
                      name: "Abhishek Verma",
                      role: "Full Stack Developer",
                      skills: [
                        { icon: <Layout className="h-4 w-4 text-blue-400" />, text: "Frontend Development" },
                        { icon: <Database className="h-4 w-4 text-blue-400" />, text: "Backend Architecture" }
                      ],
                      github: "https://github.com/GIT-Marquestra",
                      linkedin: "https://www.linkedin.com/in/abhishek-verma-6803b1309/"
                    },
                    {
                      name: "Anish Suman",
                      role: "Full Stack Developer",
                      skills: [
                        { icon: <Layout className="h-4 w-4 text-blue-400" />, text: "Frontend Development" },
                        { icon: <Database className="h-4 w-4 text-blue-400" />, text: "Backend Architecture" }
                      ],
                      github: "https://github.com/anish877",
                      linkedin: "https://www.linkedin.com/in/aniiiiiiiii/"
                    },
                    {
                      name: "Taj",
                      role: "Frontend Developer",
                      skills: [
                        { icon: <Layout className="h-4 w-4 text-blue-400" />, text: "UI/UX Design" },
                        { icon: <Code className="h-4 w-4 text-blue-400" />, text: "Frontend Implementation" }
                      ],
                      github: "https://github.com/Taj-786",
                      linkedin: "https://www.linkedin.com/in/tajuddinshaik786/"
                    }
                  ].map((contributor, index) => (
                    <div key={index} className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg overflow-hidden group">
                      <div className="absolute inset-0 rounded-lg border-2 border-transparent animate-borderMove"></div>
                      <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-blue-500/10 rounded-full filter blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"></div>
                      
                      <h3 className="text-xl font-bold text-blue-400 relative z-10">{contributor.name}</h3>
                      <p className="text-gray-300 mt-2 relative z-10">{contributor.role}</p>
                      <div className="mt-3 space-y-2 relative z-10">
                        {contributor.skills.map((skill, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm md:text-base">
                            {skill.icon}
                            <span className="text-gray-300">{skill.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4 relative z-10">
                        <Link
                          href={contributor.github}
                          target="_blank"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors duration-300"
                        >
                          <Code className="h-4 w-4 mr-1" /> GitHub
                        </Link>
                        <Link
                          href={contributor.linkedin}
                          target="_blank"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors duration-300"
                        >
                          <Linkedin className="h-4 w-4 mr-1" /> LinkedIn
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Section */}
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent animate-borderMove"></div>
                  <div className="absolute -left-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full filter blur-xl"></div>
                  
                  <h3 className="text-xl font-bold mb-4 text-blue-400 relative z-10">Tech Stack</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {[
                      { label: "Frontend and Backend", value: "Next.js" },
                      { label: "Database", value: "PostgreSQL" },
                      { label: "ORM", value: "Prisma" },
                      { label: "Auth", value: "NextAuth" }
                    ].map((tech, index) => (
                      <div key={index} className="bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm">
                        <span className="font-semibold text-sm text-blue-300">{tech.label}</span>
                        <div className="text-white text-sm mt-1 flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          {tech.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <p className="text-gray-400 text-sm text-center mt-8 pt-4 border-t border-gray-800">
              © 2025 | Keep building, keep innovating 🚀
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HeroSection;