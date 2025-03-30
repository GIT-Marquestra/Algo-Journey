'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Code, BookOpen, Brain, ChevronRight, Target, Trophy } from 'lucide-react';
import CustomizeDropdown from '@/components/ArenaDropdown';
import useTagStore from '@/store/tagsStore';

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
  const { tags } = useTagStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [topicProgress, setTopicProgress] = useState<Record<string, { 
    total: number; 
    solved: number; 
    percentage: number; 
  }>>({});
  const [shimmerLoading, setShimmerLoading] = useState<boolean>(true);

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
    <div className="min-h-screen bg-gray-50">
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
            <h1 className="text-3xl font-bold text-gray-800">
              DSA <span className="text-indigo-600">Topics</span>
            </h1>
            <p className="text-gray-600 mt-1">Master these topics to ace your technical interviews!</p>
          </div>
          <div className='flex p-2 justify-center items-center'>
            <CustomizeDropdown/>
            <Trophy className="h-10 w-10 mx-3 text-indigo-500" />
          </div>
        </div>
        
        {/* Topics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shimmerLoading ? (
            // Shimmer loading effect for cards
            Array(8).fill(0).map((_, index) => (
              <Card key={index} className="h-48 animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                    <div className="flex justify-between">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="h-8 w-full bg-gray-200 rounded-md"></div>
                </CardFooter>
              </Card>
            ))
          ) : (
            tags.map((topic) => {
              const { colors, icon } = getTopicStyling(topic);
              const topicData = topicProgress[topic] || { total: 0, solved: 0, percentage: 0 };
              
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
                      border border-gray-200
                      rounded-lg
                      overflow-hidden
                      border-l-4 ${colors.border}
                      bg-white
                      ${loading && currentTopic === topic ? colors.lightBg : 'bg-white'}
                    `}
                    onClick={() => handleTopicClick(topic)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-semibold ${colors.text}`}>
                          {topic}
                        </h3>
                        <div className={`${colors.lightBg} p-1 rounded-full`}>
                          {icon}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div 
                              className={`${colors.bg} h-2.5 rounded-full`} 
                              style={{ width: `${topicData.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Progress</span>
                          <span className="font-medium">
                            {topicData.solved || 0}/{topicData.total || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className={`w-full px-3 py-2 rounded-md flex items-center justify-center ${colors.lightBg} ${colors.text} text-sm font-medium`}>
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