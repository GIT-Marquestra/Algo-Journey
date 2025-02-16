'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

const topics = [
  "PrefixSum", "TwoPointers", "1D Arrays", "Graph", "2D Arrays",
  "Time complexity", "Basic Maths", "Space complexity", "BinarySearch",
  "DP", "Sorting", "Linear search", "Exponentiation", "Recursion"
] as const;

type TopicType = typeof topics[number];

const TopicGrid: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTopic, setCurrentTopic] = useState<TopicType | ''>('');
  const [progress, setProgress] = useState<number>(0);
  const [topicProgress, setTopicProgress] = useState<Record<string, { 
    total: number; 
    solved: number; 
    percentage: number; 
  }>>({});

  useEffect(() => {
    fetchTopicProgress();
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

  const handleTopicClick = async (topic: TopicType): Promise<void> => {
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen mt-16">
      {loading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Progress value={progress} className="w-full" />
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {topics.map((topic) => (
          <Link 
            key={topic} 
            href={`/topicwiseQuestions/${topic}`} 
            target='_blank' 
            rel="noopener noreferrer"
            className="block"
          >
            <Card 
              className={`
                h-40
                transform
                transition-all 
                duration-300 
                hover:shadow-lg 
                hover:scale-102
                hover:bg-gray-50
                border border-gray-300
                rounded-lg
                overflow-hidden
                ${loading && currentTopic === topic ? 'bg-blue-50' : 'bg-white'}
              `}
              onClick={() => handleTopicClick(topic)}
            >
              <CardHeader className="p-4 pb-2">
                <h3 className="text-lg font-semibold text-gray-800 text-center">
                  {topic}
                </h3>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  <div className="relative">
                    <Progress 
                      value={topicProgress[topic]?.percentage || 0} 
                      className="h-2 rounded-full bg-gray-100"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Progress</span>
                    <span>
                      {topicProgress[topic]?.solved || 0}/{topicProgress[topic]?.total || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopicGrid;