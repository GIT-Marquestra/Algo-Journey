"use client"
import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Code, Database, Layout, Linkedin, ArrowRight, Github } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import dashboard from '@/images/dashboard.png';
import arena0 from '@/images/arena0.png'
import arena from '@/images/arena.png'
import projectEval from '@/images/projectEval.png'
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const FollowerPointer = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  
  const mouseY = useMotionValue(0)

  const followerX = useSpring(mouseX, {
    damping: 25,
    stiffness: 300,
  })

  const followerY = useSpring(mouseY, {
    damping: 25,
    stiffness: 300,
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top } = ref.current?.getBoundingClientRect() || { left: 0, top: 0 }
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 transition duration-300 group-hover:opacity-100 blur-sm"
        style={{
          left: followerX,
          top: followerY,
          translateX: "-50%",
          translateY: "-50%",
          width: 30,
          height: 30,
        }}
      />
      {children}
    </div>
  )
}

const BackgroundGradient = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400 rounded-full filter blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-400 rounded-full filter blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-3/4 left-1/2 w-[400px] h-[400px] bg-purple-400 rounded-full filter blur-[120px] animate-pulse"
          style={{ animationDelay: "3.5s" }}
        ></div>
      </div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <motion.div
      className="relative group rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition duration-300"></div>
      <div className="mb-4 rounded-full w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  )
}

const LandingPage = () => {
  const { scrollYProgress } = useScroll()
  const { data: session } = useSession()
  const Router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const sentence = "We are dedicated to providing an exceptional learning experience."

  const imageDescriptions = [
    {
      image: dashboard,
      title: "Watch your profile grow",
      description: "Be consistent and track your progress with detailed analytics and personalized insights.",
      alignment: "left",
    },
    {
      image: arena0,
      title: "Interactive Coding Challenges",
      description: "Engage with real-world coding problems that test and enhance your algorithmic thinking.",
      alignment: "right",
    },
    {
      image: arena,
      title: "Comprehensive Learning Paths",
      description: "Structured curriculum designed to take you from beginner to advanced algorithm master.",
      alignment: "left",
    },
    {
      image: projectEval,
      title: "Real-time Performance Tracking",
      description: "Monitor your progress, identify strengths, and focus on areas that need improvement.",
      alignment: "right",
    },
  ]

  const scaleProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  const opacityProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div className="relative w-full overflow-hidden bg-white">
      <BackgroundGradient />

      {/* Follower Line */}
      <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-blue-400 to-transparent transform -translate-x-1/2 z-10"></div>
      {/* Animated Dots on Line */}
      <div className="absolute left-1/2 top-0 h-full transform -translate-x-1/2 z-10 pointer-events-none">
        <div className="relative h-full w-4">
          {[0.2, 0.4, 0.6, 0.8].map((position, index) => (
            <motion.div
              key={index}
              className="absolute left-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 shadow-lg shadow-blue-500/50"
              style={{ top: `${position * 100}%` }}
              animate={{
                y: [0, 20, 0],
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 1.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <FollowerPointer>
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-white opacity-80"></div>
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-blue-100"
                  style={{
                    width: Math.random() * 100 + 50,
                    height: Math.random() * 100 + 50,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.15,
                  }}
                  animate={{
                    y: [0, Math.random() * 30 - 15],
                    x: [0, Math.random() * 30 - 15],
                  }}
                  transition={{
                    duration: Math.random() * 5 + 10,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
          <motion.div
            className="text-center max-w-5xl mx-auto"
            style={{
              scale: scaleProgress,
              opacity: opacityProgress,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <span className="px-4 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-700">
                Elevate Your Coding Skills
              </span>
            </motion.div>

            <div className="relative">
              {/* Background pattern */}
              <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-100/30 blur-3xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 translate-x-[10%] translate-y-[10%] rounded-full bg-indigo-200/20 blur-3xl"
                    animate={{
                      scale: [1.1, 1, 1.1],
                      rotate: [0, -5, 0],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 -translate-x-[15%] -translate-y-[10%] rounded-full bg-purple-200/20 blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, 0],
                      opacity: [0.3, 0.2, 0.3],
                    }}
                    transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                </div>
                <svg className="absolute inset-0 h-full w-full stroke-gray-200 opacity-20 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]">
                  <defs>
                    <pattern
                      id="hero-pattern"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                      patternTransform="translate(-20 -20)"
                    >
                      <path d="M.5 40V.5H40" fill="none" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" strokeWidth="0" fill="url(#hero-pattern)" />
                </svg>
              </div>

              <motion.h1
                className="text-6xl md:text-8xl font-bold tracking-tight mb-4 relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                  AlgoJourney
                </span>
              </motion.h1>
            </div>

            <motion.p
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Master algorithms, track your progress, and join a community of passionate developers on your coding
              journey.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {
                !session && <Button onClick={() => {
                  Router.push('/auth/signin')
                }} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              }
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
          >
            <ChevronDown className="h-8 w-8 text-blue-500" />
          </motion.div>
        </section>
      </FollowerPointer>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute left-1/2 top-0 h-20 w-[2px] bg-gradient-to-b from-blue-400 to-transparent transform -translate-x-1/2"></div>

        <motion.div
          className="max-w-7xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Why Choose AlgoJourney?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform is designed to help you master algorithms and data structures through interactive learning.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Code className="h-6 w-6" />}
            title="Interactive Challenges"
            description="Practice with real-world coding problems that strengthen your algorithmic thinking and problem-solving skills."
          />
          <FeatureCard
            icon={<Layout className="h-6 w-6" />}
            title="Visual Learning"
            description="Understand complex algorithms through interactive visualizations and step-by-step explanations."
          />
          <FeatureCard
            icon={<Database className="h-6 w-6" />}
            title="Progress Tracking"
            description="Monitor your improvement with detailed analytics and personalized insights on your performance."
          />
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-20 px-4 bg-gray-50 relative">
        <div className="absolute left-1/2 top-0 h-20 w-[2px] bg-gradient-to-b from-blue-400 to-transparent transform -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto">
          {imageDescriptions.map((item, index) => (
            <motion.div
              key={index}
              className={`flex flex-col ${item.alignment === "left" ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 mb-24 last:mb-0`}
              initial={{ opacity: 0, x: item.alignment === "left" ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <CardContainer className="inter-var w-full md:w-1/2">
                <CardBody className="relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] bg-white border-white/[0.2] w-full h-auto rounded-xl p-6 border">
                  <CardItem translateZ="50" className="w-full">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      height="400"
                      width="600"
                      className="w-full h-[300px] md:h-[400px] object-cover rounded-xl group-hover/card:shadow-xl"
                      alt={item.title}
                    />
                  </CardItem>
                </CardBody>
              </CardContainer>
              <div className={`w-full md:w-1/2 ${item.alignment === "left" ? "md:pl-8" : "md:pr-8"}`}>
                <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-4">{item.title}</h3>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Account Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute left-1/2 top-0 h-20 w-[2px] bg-gradient-to-b from-blue-400 to-transparent transform -translate-x-1/2"></div>

        <motion.div
          className="max-w-lg mx-auto px-6 py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-blue-700 mb-4">Try Without Registration</h3>
          <p className="text-gray-700 mb-6">
            Want to explore AlgoJourney without creating an account? Use our demo account:
          </p>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-700">Username:</span>
              <code className="bg-gray-100 px-3 py-1 rounded-md text-blue-700 font-mono">Visitor</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Password:</span>
              <code className="bg-gray-100 px-3 py-1 rounded-md text-blue-700 font-mono">Visitor1234</code>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Note: This is a read-only account with limited functionality.</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => Router.push('/auth/signin')} className="bg-blue-600 hover:bg-blue-700 text-white">Try Demo Account</Button>
          </div>
        </motion.div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4 bg-gray-50 relative">
        <div className="absolute left-1/2 top-0 h-20 w-[2px] bg-gradient-to-b from-blue-400 to-transparent transform -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            What Our Users Say
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[
              {
                quote:
                  "AlgoJourney transformed how I approach algorithm problems. The visual explanations make complex concepts easy to understand.",
                name: "Sarah Johnson",
                title: "Software Engineer",
              },
              {
                quote:
                  "I improved my coding interview skills dramatically after just a few weeks of consistent practice on AlgoJourney.",
                name: "Michael Chen",
                title: "CS Student",
              },
              {
                quote:
                  "The progress tracking feature helps me identify my weak areas and focus my learning effectively.",
                name: "Priya Patel",
                title: "Frontend Developer",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="mb-4 text-blue-500">
                  <svg width="45" height="36" className="fill-current">
                    <path d="M13.415.43c-2.523 0-4.75 1.173-6.682 3.52C4.8 6.298 3.756 9.38 3.756 12.89c0 6.498 3.442 11.46 10.325 14.887-1.841 2.318-3.165 4.574-3.165 7.06 0 5.993 4.239 10.742 10.823 10.742 5.471 0 9.643-3.325 9.643-9.252 0-5.38-3.786-8.787-8.585-11.46-1.841-1.037-2.885-2.318-3.038-5.026 2.154.345 3.977.345 5.471-.346 4.239-1.729 6.682-5.471 6.682-10.051 0-6.498-4.926-9.02-8.585-9.02 0 0 .346 1.037-1.037 0-1.841-1.037-5.471-1.037-8.876 0zm51.6 0c-2.523 0-4.75 1.173-6.682 3.52-1.933 2.347-2.977 5.43-2.977 8.94 0 6.498 3.442 11.46 10.325 14.887-1.841 2.318-3.165 4.574-3.165 7.06 0 5.993 4.239 10.742 10.823 10.742 5.471 0 9.643-3.325 9.643-9.252 0-5.38-3.786-8.787-8.585-11.46-1.841-1.037-2.885-2.318-3.038-5.026 2.154.345 3.977.345 5.471-.346 4.239-1.729 6.682-5.471 6.682-10.051 0-6.498-4.926-9.02-8.585-9.02 0 0 .346 1.037-1.037 0-1.841-1.037-5.471-1.037-8.876 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute left-1/2 top-0 h-20 w-[2px] bg-gradient-to-b from-blue-400 to-transparent transform -translate-x-1/2"></div>

        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Ready to Start Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
              AlgoJourney
            </span>
            ?
          </h2>
          <div className="mt-4 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 inline-block mb-8">
            <p className="text-gray-700 text-lg md:text-xl">
              <TextGenerateEffect words={sentence} />
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {
              !session && <Button onClick={() => {
                Router.push('/auth/signin')
              }} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button> 
            }
            <Button
              variant="outline"
              onClick={() => Router.push('/about')}
              className="border-2 border-blue-200 hover:border-blue-300 text-blue-700 px-8 py-6 rounded-full text-lg"
            >
              About AlgoJourney
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-slate-900 text-white py-16 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-6">
            <div className="flex items-center justify-center space-x-4 pb-4">
              <h4 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">
                Meet Our Contributors
              </h4>
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

            <CollapsibleContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contributor Cards */}
                {[
                  {
                    name: "Abhishek Verma",
                    role: "Full Stack Developer",
                    skills: [
                      { icon: <Layout className="h-4 w-4 text-blue-400" />, text: "Frontend Development" },
                      { icon: <Database className="h-4 w-4 text-blue-400" />, text: "Backend Architecture" },
                    ],
                    github: "https://github.com/GIT-Marquestra",
                    linkedin: "https://www.linkedin.com/in/abhishek-verma-6803b1309/",
                  },
                  {
                    name: "Anish Suman",
                    role: "Full Stack Developer",
                    skills: [
                      { icon: <Layout className="h-4 w-4 text-blue-400" />, text: "Frontend Development" },
                      { icon: <Database className="h-4 w-4 text-blue-400" />, text: "Backend Architecture" },
                    ],
                    github: "https://github.com/anish877",
                    linkedin: "https://www.linkedin.com/in/aniiiiiiiii/",
                  },
                  {
                    name: "Taj",
                    role: "Frontend Developer",
                    skills: [
                      { icon: <Layout className="h-4 w-4 text-blue-400" />, text: "UI/UX Design" },
                      { icon: <Code className="h-4 w-4 text-blue-400" />, text: "Frontend Implementation" },
                    ],
                    github: "https://github.com/Taj-786",
                    linkedin: "https://www.linkedin.com/in/tajuddinshaik786/",
                  },
                ].map((contributor, index) => (
                  <div
                    key={index}
                    className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg overflow-hidden group"
                  >
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
                        <Github className="h-4 w-4 mr-1" /> GitHub
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
                <div className="absolute -left-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full filter blur-xl"></div>

                <h3 className="text-xl font-bold mb-4 text-blue-400 relative z-10">Tech Stack</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                  {[
                    { label: "Frontend and Backend", value: "Next.js" },
                    { label: "Database", value: "PostgreSQL" },
                    { label: "ORM", value: "Prisma" },
                    { label: "Auth", value: "NextAuth" },
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

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">AlgoJourney</h4>
              <p className="text-gray-400">
                Empowering developers to master algorithms and data structures through interactive learning.
              </p>
              <div className="flex space-x-4 mt-4">
                <Link href="#" className="text-gray-400 hover:text-white">
                  <Github className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <Linkedin className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">Subscribe</h4>
              <p className="text-gray-400 mb-4">Stay updated with our latest features and releases.</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-l-none">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AlgoJourney | Keep building, keep innovating 🚀
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

