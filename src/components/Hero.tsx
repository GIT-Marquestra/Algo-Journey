'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import img1 from '@/images/landing.png'
import { ArrowRight, ChevronDown, ChevronUp, Code, Database, Layout } from "lucide-react";
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
      {/* Hero Section */}
      <h1 className="text-black text-6xl md:text-8xl lg:text-9xl font-mono text-center pt-32 md:pt-56">
        Welcome
      </h1>
      <h1 className="text-black text-4xl md:text-6xl lg:text-7xl font-mono text-center">
        to AlgoJourney
      </h1>

      {/* Get Started Button */}
      <div className="flex w-full justify-center pt-10">
        {!session && (
          <Button
            size="lg"
            className="animate-buttonPulse w-40 md:w-48 bg-gradient-to-r from-black to-slate-300 hover:from-black hover:to-gray-400 shadow-lg hover:shadow-xl transition-all duration-300"
            asChild
          >
            <Link href="/auth/signin" className="text-white flex items-center">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5 text-white" />
            </Link>
          </Button>
        )}
      </div>

      {/* Hero Image */}
      <div className="w-full flex justify-center pt-10">
        <Image
          src={img1}
          alt="Landing Page"
          width={1200}
          height={500}
          className="w-[90%] md:w-[80%] lg:w-[70%] h-auto"
        />
      </div>

      <div className='m-9'>
        <TextGenerateEffect words={sentence}/>
      </div>

      {/* Key Features Section */}
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

        {/* AlgoJourney Statement */}
        <div className="text-center mt-32 md:mt-48">
          <h2 className="text-gray-600 text-4xl md:text-5xl lg:text-6xl font-semibold">
            On Algojourney
          </h2>
          <p className="text-gray-400 text-lg md:text-2xl lg:text-3xl mt-2">
            We are dedicated to providing an exceptional learning experience.
          </p>
        </div>
      </div>

      {/* Footer with Contributors Toggle */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-400">Abhishek</h3>
                  <p className="text-gray-300 mt-2">Full Stack Developer</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-gray-400" />
                      <span>Frontend Development</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      <span>Backend Architecture</span>
                    </div>
                  </div>
                  <a
                    href="https://github.com/GIT-Marquestra"
                    target="_blank"
                    className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300"
                  >
                    <Code className="h-4 w-4 mr-2" /> GitHub
                  </a>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-400">Taj</h3>
                  <p className="text-gray-300 mt-2">Frontend Developer</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-gray-400" />
                      <span>UI/UX Design</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-gray-400" />
                      <span>Frontend Implementation</span>
                    </div>
                  </div>
                  <a
                    href="https://github.com/taj"
                    target="_blank"
                    className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300"
                  >
                    <Code className="h-4 w-4 mr-2" /> GitHub
                  </a>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg mt-4">
                <h3 className="text-xl font-bold mb-3">Tech Stack</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Frontend and Backend:</span>
                    <span className="text-gray-300">Next.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Database:</span>
                    <span className="text-gray-300">PostgreSQL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">ORM:</span>
                    <span className="text-gray-300">Prisma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Auth:</span>
                    <span className="text-gray-300">NextAuth</span>
                  </div>
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