import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define types for our component
type Difficulty = {
  value: string;
  label: string;
};

type CustomizeDropdownProps = {
  onApply?: (selectedTopics: string[], selectedDifficulties: string[]) => void;
};

const CustomizeDropdown: React.FC<CustomizeDropdownProps> = ({ onApply }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const Router = useRouter();

  const topics: string[] = [
    "PrefixSum", "TwoPointers", "1DArrays", "Graph", "2DArrays", 
    "TimeComplexity", "BasicMaths", "SpaceComplexity", "BinarySearch", 
    "DP", "Sorting", "LinearSearch", "Exponentiation", "Recursion"
  ];

  const difficulties: Difficulty[] = [
    { value: 'ALL', label: 'All Difficulties' },
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
    { value: 'VERYHARD', label: 'Very Hard' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTopic = (topic: string): void => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  };

  const toggleDifficulty = (diffValue: string): void => {
    setSelectedDifficulties(prev => 
      prev.includes(diffValue) 
        ? prev.filter(d => d !== diffValue) 
        : [...prev, diffValue]
    );
  };

  const handleButtonClick = (): void => {
    setIsOpen(!isOpen);
  };

  const handleApply = (): void => {
    console.log(`/topicwiseQuestions/s/${selectedTopics.join('/')}/s/${selectedDifficulties.join('/')}`)
    Router.push(`/topicwiseQuestions/s/${selectedTopics.join('/')}/s/${selectedDifficulties.join('/')}`);
    
    if (onApply) {
      onApply(selectedTopics, selectedDifficulties);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleButtonClick}
        className="flex items-center bg-indigo-500 hover:bg-indigo-400 text-white py-2 px-4 rounded text-sm"
      >
        Customize
        <ChevronDown className="ml-1 h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute mt-1 right-0 w-64 bg-white rounded shadow-lg border border-gray-200 z-50">
          <div className="p-3">
            <h3 className="font-medium text-gray-700 mb-2">Topics</h3>
            <div className="max-h-40 overflow-y-auto">
              {topics.map((topic) => (
                <div key={topic} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`topic-${topic}`}
                    checked={selectedTopics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                    className="mr-2"
                  />
                  <label htmlFor={`topic-${topic}`} className="text-sm">{topic}</label>
                </div>
              ))}
            </div>
            
            <h3 className="font-medium text-gray-700 mt-4 mb-2">Difficulty</h3>
            <div>
              {difficulties.map((diff) => (
                <div key={diff.value} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`diff-${diff.value}`}
                    checked={selectedDifficulties.includes(diff.value)}
                    onChange={() => toggleDifficulty(diff.value)}
                    className="mr-2"
                  />
                  <label htmlFor={`diff-${diff.value}`} className="text-sm">{diff.label}</label>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleApply}
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-400 text-white py-1 px-3 rounded text-sm"
            >
              Solve
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizeDropdown;