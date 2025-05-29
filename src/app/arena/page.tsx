'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Code, BookOpen, Brain, ChevronRight, Target, Trophy } from 'lucide-react'
import useTagStore from '@/store/tagsStore';
import useStore from '@/store/store';

// Topic categories for color assignment with specific types
type TopicCategory = 'algorithms' | 'dataStructures' | 'concepts';

// Mapping for icons and categories - maintained in frontend
const topicMappings: Record<string, {
  category: TopicCategory;
  icon: React.ReactNode;
}> = {
  "PrefixSum": { category: 'algorithms', icon: <Code className="h-5 w-5" /> },
  "TwoPointers": { category: 'algorithms', icon: <Code className="h-5 w-5" /> },
  "BinarySearch": { category: 'algorithms', icon: <Brain className="h-5 w-5" /> },
  "LinearSearch": { category: 'algorithms', icon: <Target className="h-5 w-5" /> },
  "Sorting": { category: 'algorithms', icon: <Code className="h-5 w-5" /> },
  "DP": { category: 'algorithms', icon: <Brain className="h-5 w-5" /> },
  "Recursion": { category: 'algorithms', icon: <Brain className="h-5 w-5" /> },
  "1DArrays": { category: 'dataStructures', icon: <Code className="h-5 w-5" /> },
  "2DArrays": { category: 'dataStructures', icon: <Code className="h-5 w-5" /> },
  "Graph": { category: 'dataStructures', icon: <Code className="h-5 w-5" /> },
  "TimeComplexity": { category: 'concepts', icon: <Code className="h-5 w-5" /> },
  "SpaceComplexity": { category: 'concepts', icon: <Code className="h-5 w-5" /> },
  "BasicMaths": { category: 'concepts', icon: <BookOpen className="h-5 w-5" /> },
  "Exponentiation": { category: 'concepts', icon: <BookOpen className="h-5 w-5" /> }
};

// Default fallbacks for unknown topics
const defaultMapping = {
  category: 'concepts' as TopicCategory,
  icon: <Code className="h-5 w-5" />
};

// Color schemes based on category
const categoryColors: Record<TopicCategory, {
  bg: string, 
  border: string, 
  text: string, 
  lightBg: string
}> = {
  'algorithms': {bg: "bg-indigo-500", border: "border-indigo-400", text: "text-indigo-500", lightBg: "bg-indigo-50"},
  'dataStructures': {bg: "bg-teal-500", border: "border-teal-400", text: "text-teal-500", lightBg: "bg-teal-50"},
  'concepts': {bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-500", lightBg: "bg-blue-50"}
};

const TopicGrid: React.FC = () => {
  const { tags, setTags } = useTagStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const { isDarkMode } = useStore();
  const [progress, setProgress] = useState<number>(0);
  const [topicProgress, setTopicProgress] = useState<Record<string, { 
    total: number; 
    solved: number; 
    percentage: number; 
  }>>({});
  const [shimmerLoading, setShimmerLoading] = useState<boolean>(true);

  const fn = async () => {
    const res = await axios.get('/api/getTags')
    console.log(res)
    //@ts-expect-error: not needed here.
    const tags = res.data.map((p) => p.name)
    setTags(tags)
  }

  useEffect(() => {
    fn()
  }, []);


  

  useEffect(() => {
    fetchTopicProgress();
    // Simulate initial loading
    setTimeout(() => {
      setShimmerLoading(false);
    }, 1500);
  }, []);

  const fetchTopicProgress = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/getProgress');
      if(!response.data) return;
      setTopicProgress(response.data.topicProgress);
    } catch (error) {
      console.error('Error fetching topic progress:', error);
    }
  };

  const handleTopicClick = async (topic: string): Promise<void> => {
    setLoading(true);
    setCurrentTopic(topic);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const response = await axios.post('/api/getTopicQuestions', {
        topic: topic
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
      setProgress(0);
    }
  };

  // Helper function to get styling for a topic
  const getTopicStyling = (topic: string) => {
    const mapping = topicMappings[topic] || defaultMapping;
    return {
      icon: mapping.icon,
      colors: categoryColors[mapping.category]
    };
  };

  return (
  <div className={`min-h-screen transition-colors duration-300 ${
    isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
  }`}>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 space-y-8">
      {/* Loading progress indicator */}
      {loading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Progress value={progress} className="w-full h-1" />
        </div>
      )}
      
      {/* Title and description */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            DSA <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>Topics</span>
          </h1>
          <p className={`mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Master these topics to ace your technical interviews!</p>
        </div>
        <div className='flex p-2 justify-center items-center'>
          <Trophy className={`h-10 w-10 mx-3 ${
            isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
          }`} />
        </div>
      </div>
      
      {/* Topics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shimmerLoading ? (
          // Shimmer loading effect for cards
          Array(8).fill(0).map((_, index) => (
            <Card key={index} className={`h-48 animate-pulse ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`h-4 w-24 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-6 w-6 rounded-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-4">
                  <div className={`h-2 w-full rounded-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className="flex justify-between">
                    <div className={`h-4 w-16 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-4 w-12 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className={`h-8 w-full rounded-md ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </CardFooter>
            </Card>
          ))
        ) : (
          tags.map((topic) => {
            const { colors, icon } = getTopicStyling(topic);
            const topicData = topicProgress[topic] || { total: 0, solved: 0, percentage: 0 };
            
            // Dark mode color variations for categories
            const getDarkModeColors = () => {
              const darkColorSchemes: Record<TopicCategory, {
                bg: string, 
                border: string, 
                text: string, 
                lightBg: string
              }> = {
                'algorithms': {
                  bg: "bg-indigo-500", 
                  border: "border-indigo-500/50", 
                  text: isDarkMode ? "text-indigo-400" : "text-indigo-500", 
                  lightBg: isDarkMode ? "bg-indigo-900/20" : "bg-indigo-50"
                },
                'dataStructures': {
                  bg: "bg-teal-500", 
                  border: "border-teal-500/50", 
                  text: isDarkMode ? "text-teal-400" : "text-teal-500", 
                  lightBg: isDarkMode ? "bg-teal-900/20" : "bg-teal-50"
                },
                'concepts': {
                  bg: "bg-blue-500", 
                  border: "border-blue-500/50", 
                  text: isDarkMode ? "text-blue-400" : "text-blue-500", 
                  lightBg: isDarkMode ? "bg-blue-900/20" : "bg-blue-50"
                }
              };
              
              const mapping = topicMappings[topic] || defaultMapping;
              return darkColorSchemes[mapping.category];
            };
            
            const adaptiveColors = getDarkModeColors();
            
            return (
              <Link 
                key={topic} 
                href={`/topicwiseQuestions/s/${topic}/s/BEGINNER/EASY/MEDIUM/HARD/VERYHARD`} 
                target='_blank' 
                rel="noopener noreferrer"
                className="block"
              >
                <Card 
                  className={`
                    h-48
                    transform
                    transition-all 
                    duration-300 
                    hover:shadow-lg 
                    hover:scale-105
                    border
                    rounded-lg
                    overflow-hidden
                    border-l-4 ${isDarkMode ? adaptiveColors.border : colors.border}
                    ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200'}
                    ${loading && currentTopic === topic ? adaptiveColors.lightBg : (isDarkMode ? 'bg-gray-800' : 'bg-white')}
                  `}
                  onClick={() => handleTopicClick(topic)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold ${adaptiveColors.text}`}>
                        {topic}
                      </h3>
                      <div className={`${adaptiveColors.lightBg} p-1 rounded-full`}>
                        {icon}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      <div className="relative">
                        <div className={`w-full rounded-full h-2.5 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <div 
                            className={`${adaptiveColors.bg} h-2.5 rounded-full`} 
                            style={{ width: `${topicData.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className={`flex justify-between items-center text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <span>Progress</span>
                        <span className="font-medium">
                          {topicData.solved || 0}/{topicData.total || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className={`w-full px-3 py-2 rounded-md flex items-center justify-center ${adaptiveColors.lightBg} ${adaptiveColors.text} text-sm font-medium`}>
                      Practice Questions <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  </div>
);
};

export default TopicGrid;