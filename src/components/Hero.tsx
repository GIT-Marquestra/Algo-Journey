'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import img1 from '@/images/landing.jpg'
import { ArrowRight, ChevronDown, ChevronUp, Code, Database, Layout, Linkedin } from "lucide-react";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { TextGenerateEffect } from './ui/text-generate-effect';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const HeroSection = () => {
  const sentence = "We are dedicated to providing an exceptional learning experience."
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white relative w-screen h-auto flex flex-col items-center">
      {/* Previous sections remain unchanged */}
      <h1 className="text-black text-6xl md:text-8xl lg:text-9xl font-mono text-center pt-32 md:pt-56">
        Welcome
      </h1>
      <h1 className="text-black text-4xl md:text-6xl lg:text-7xl font-mono text-center">
        to AlgoJourney
      </h1>

      <div className="flex w-full justify-center pt-10">
        {!session && (
          <Button
          size="lg"
          className="animate-[buttonPulse_360s_infinite_linear] w-40 md:w-48 bg-gradient-to-r from-black to-slate-300 hover:from-black hover:to-gray-400 shadow-lg hover:shadow-xl transition-all duration-300"
          asChild
        >
            <Link href="/auth/signin" className="text-white flex items-center">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5 text-white" />
            </Link>
          </Button>
        )}
      </div>

      <div className="w-full flex justify-center pt-10">
        <Image
          src={img1}
          alt="Landing Page"
          width={1200}
          height={500}
          className="w-[90%] md:w-[80%] lg:w-[70%] h-auto"
        />
      </div>

      <div className="max-w-6xl w-full px-4 md:px-8 py-16">
        <h1 className="text-black font-bold text-3xl md:text-4xl text-center mb-10">
          Key Features
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {[
            {
              title: "Weekly Coding Contests",
              description: "Compete, rank up, and sharpen your problem-solving skills.",
            },
            {
              title: "Interactive Progress Tracker",
              description: "See how many problems you've solved and track your growth.",
            },
            {
              title: "Competitive Leaderboard",
              description: "Rank yourself among peers in weekly & monthly contests.",
            },
            {
              title: "Topic-Wise Practice",
              description: "Solve handpicked problems to master Data Structures & Algorithms.",
            },
          ].map((feature, index) => (
            <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-sm">
              <h2 className="text-black font-extrabold text-xl">{feature.title}</h2>
              <p className="text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-32 md:mt-48">
          <h2 className="text-gray-600 text-4xl md:text-5xl lg:text-6xl font-semibold">
            On Algojourney
          </h2>
          <p className="text-gray-400 text-lg md:text-2xl lg:text-3xl mt-2">
            <TextGenerateEffect words={sentence}/>
          </p>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-6 w-full">
        <div className="max-w-6xl mx-auto px-4">
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="space-y-2"
          >
            <div className="flex items-center justify-center space-x-4 pb-4">
              <h4 className="text-lg font-semibold">Meet Our Contributors</h4>
              <CollapsibleTrigger asChild>
                <Button size="sm" className="w-9 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-white" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contributor Cards */}
                {[
                  {
                    name: "Abhishek",
                    role: "Full Stack Developer",
                    skills: [
                      { icon: <Layout className="h-4 w-4 text-gray-400" />, text: "Frontend Development" },
                      { icon: <Database className="h-4 w-4 text-gray-400" />, text: "Backend Architecture" }
                    ],
                    github: "https://github.com/GIT-Marquestra",
                    linkedin: "https://www.linkedin.com/in/abhishek-verma-6803b1309/"
                  },
                  {
                    name: "Taj",
                    role: "Frontend Developer",
                    skills: [
                      { icon: <Layout className="h-4 w-4 text-gray-400" />, text: "UI/UX Design" },
                      { icon: <Code className="h-4 w-4 text-gray-400" />, text: "Frontend Implementation" }
                    ],
                    github: "https://github.com/Taj-786",
                    linkedin: "https://www.linkedin.com/in/tajuddinshaik786/"
                  }
                ].map((contributor, index) => (
                  <div key={index} className="relative bg-gray-800 p-4 md:p-6 rounded-lg">
                    <div className="absolute inset-0 rounded-lg border-2 border-transparent animate-borderMove"></div>
                    <h3 className="text-xl font-bold text-blue-400">{contributor.name}</h3>
                    <p className="text-gray-300 mt-2">{contributor.role}</p>
                    <div className="mt-3 space-y-2">
                      {contributor.skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm md:text-base">
                          {skill.icon}
                          <span>{skill.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4">
                      <a
                        href={contributor.github}
                        target="_blank"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <Code className="h-4 w-4 mr-1" /> GitHub
                      </a>
                      <a
                        href={contributor.linkedin}
                        target="_blank"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <Linkedin className="h-4 w-4 mr-1" /> LinkedIn
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Stack Section */}
              <div className="relative bg-gray-800 p-4 md:p-6 rounded-lg">
              <div className="absolute inset-0 rounded-lg border-2 border-transparent animate-borderMove"></div>
                <h3 className="text-xl font-bold mb-3">Tech Stack</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Frontend and Backend", value: "Next.js" },
                    { label: "Database", value: "PostgreSQL" },
                    { label: "ORM", value: "Prisma" },
                    { label: "Auth", value: "NextAuth" }
                  ].map((tech, index) => (
                    <div key={index} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                      <span className="font-semibold text-sm">{tech.label}:</span>
                      <span className="text-gray-300 text-sm">{tech.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <p className="text-gray-500 text-sm text-center mt-6">
            © 2025 | Keep building, keep innovating 🚀
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HeroSection;