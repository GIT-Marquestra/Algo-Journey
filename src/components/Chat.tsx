'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ProjectorIcon, Paperclip, X, Globe, Code, FileText, CheckCircle, Github } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Octokit } from "@octokit/core";
import ThinkingLoader from './ThinkingLoader';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ProjectDetails {
  githubUrl: string;
  techStack: string;
  projectType: string;
  demoUrl: string;
  description: string;
  filePath: string;
  demoCode: string
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [repos, setRepos] = useState<string[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false)
  const params = useParams();
  const [githubConnected, setGithubConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const Router = useRouter();
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    githubUrl: '',
    techStack: '',
    projectType: '',
    demoUrl: '',
    description: '',
    filePath: '',
    demoCode: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getRepos = async () => {
    try {
      setIsLoadingRepos(true);
      const res = await axios.post('/api/fetchRepos', {
        accessToken
      });
      
      if(res.status === 235){
        toast.error(res.data.message);
        setIsLoadingRepos(false);
        return;
      }
      
      if(res.status === 200){
        toast.success('Repositories loaded successfully');
        setRepos(res.data.repos);
        setGithubUsername(res.data.githubUsername)
      }
      
      setIsLoadingRepos(false);
    } catch (error) {
      console.error('Error in getRepos', error);
      toast.error('Token Expired, Reconnect Github');
      connect()
      setIsLoadingRepos(false);
    }
  }

  useEffect(() => {
    if(params && params.array && params.array.length > 0){
      const a = params.array[1];
      const b = params.array[0];
      if(a){
        setAccessToken(a as string);
      } else{
        toast.success('Getting token from local storage')
        const c = localStorage.getItem('githubAccessToken')
        setAccessToken(c)
      }
      if(b === 'true'){
        setGithubConnected(true);
      } else {
        setGithubConnected(false);
        if(a){
          localStorage.setItem('githubAccessToken', accessToken as string);
          Router.replace('/chat/true');
        }
        if(b === 'false') {
          toast.error('Github not connected');
          return;
        }
        toast.success('Github connected');
      }
    }
  }, []);
  
  // Update GitHub URL when a repo is selected
  useEffect(() => {
    if (selectedRepo) {
      setProjectDetails(prev => ({
        ...prev,
        githubUrl: `https://github.com/${githubUsername}/${selectedRepo}`
      }));
    }
  }, [selectedRepo]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    
    const messageText = customText || input;
    if (!messageText.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for submitting your project details! I&apos;ll analyze your repository and provide feedback shortly.",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const octokit = new Octokit({
      auth: accessToken
    });

    if(!githubUsername) {
      toast.error('Github Username No Found')
      return 
    }

    let formattedMessage = `
    GitHub Repository: ${projectDetails.githubUrl}
    Tech Stack: ${projectDetails.techStack}
    Project Type: ${projectDetails.projectType}
    Live Demo: ${projectDetails.demoUrl}
    Description: ${projectDetails.description}
        `.trim();

    try {
      const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: githubUsername,
        repo: selectedRepo,
        path: projectDetails.filePath,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
  
      //@ts-expect-error: dont know what to do here
      const content = Buffer.from(response.data.content, 'base64').toString('utf8');
      setProjectDetails({...projectDetails, demoCode: content})
      formattedMessage = `
    GitHub Repository: ${projectDetails.githubUrl}
    Tech Stack: ${projectDetails.techStack}
    Project Type: ${projectDetails.projectType}
    Live Demo: ${projectDetails.demoUrl}
    Description: ${projectDetails.description}
    Demo Code: ${content}
        `.trim();
    } catch (error) {
      console.error(`Error fetching file content: ${error}`);
    }
    
    
    // Close modal
    setShowModal(false);
    handleSendMessage(e, formattedMessage);

    setLoading(true)

    try{
      const response = await axios.post("/api/geminiRate", {
       formattedMessage
      });
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response.data.insights,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((p) => [...p, aiMessage])

    } catch(error){
      console.error('Error while getting rating from ai: ', error)
    } finally{
      setLoading(false)
    }

  };

  const modalOpen = () => {
    if(githubConnected){
      setShowModal(true);
    } else {
      connect();
    }
  };

  const connectGithub = async () => {
    try {
      window.location.href = "/api/auth/github/login";
    } catch (error) {
      console.log('Error in connectGithub function', error);
    }
  };

  const connect = () => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="font-semibold">You're Github isn't connected</p>
        <div className="flex gap-2 mt-2 justify-center">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              connectGithub();
            }} 
            className="bg-green-400 px-3 py-1 rounded"
          >
            Connect
          </button>
        </div>
      </div>
    ), { duration: 5000 }); 
  };

  const selectRepository = (repo: string) => {
    setSelectedRepo(repo);
  };

  return (
    <div className="flex mt-24 flex-col w-full h-[90vh] max-w-[70%] mx-auto relative">
      {/* Messages area */}
      {loading && <ThinkingLoader/>}
      <div className="flex-1 p-4 pb-24 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot size={48} className="mb-4 text-blue-300" />
            <p className="text-center">Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex max-w-3/4 rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-blue-200 text-blue-900 rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    {message.sender === 'ai' ? (
                      <Bot size={16} className="mr-1 text-blue-400" />
                    ) : (
                      <User size={16} className="mr-1 text-blue-600" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.sender === 'ai' ? 'AI Assistant' : 'You'} • {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex mb-4 justify-start">
            <div className="flex max-w-3/4 rounded-lg p-4 bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm">
              <div className="flex items-center space-x-2">
                <Bot size={16} className="mr-1 text-blue-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Project Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ProjectorIcon className="mr-2 text-blue-500" size={20} />
                  Project Evaluation
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleProjectSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1  items-center">
                      <Github size={16} className="mr-1 text-gray-500" />
                      GitHub Repository URL <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="mb-2">
                      <input
                        type="url"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="https://github.com/username/repo"
                        value={projectDetails.githubUrl}
                        readOnly
                        onChange={(e) => setProjectDetails({...projectDetails, githubUrl: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Button 
                        onClick={getRepos} 
                        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
                        disabled={isLoadingRepos}
                      >
                        <Github size={16} />
                        {isLoadingRepos ? 'Loading...' : 'Import from GitHub'}
                      </Button>
                      
                      {selectedRepo && (
                        <div className="text-sm text-green-600 flex items-center">
                          <CheckCircle size={14} className="mr-1" />
                          Selected: {selectedRepo.split('/')[1]}
                        </div>
                      )}
                    </div>
                    
                    {repos.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto">
                        <div className="text-sm mb-2 text-gray-500">Select a repository:</div>
                        <div className="grid grid-cols-1 gap-1">
                          {repos.map((repo) => (
                            <button
                              type="button"
                              key={repo}
                              onClick={() => selectRepository(repo)}
                              className={`text-left px-3 py-2 rounded-md text-sm flex items-center ${
                                selectedRepo === repo
                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <Github size={14} className="mr-2 text-gray-500" />
                              {repo}
                              {selectedRepo === repo && (
                                <CheckCircle size={14} className="ml-auto text-blue-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1  items-center">
                      <Code size={16} className="mr-1 text-gray-500" />
                      Tech Stack <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Next.js, TailwindCSS, Prisma, PostgreSQL"
                      value={projectDetails.techStack}
                      onChange={(e) => setProjectDetails({...projectDetails, techStack: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1  items-center">
                      <Code size={16} className="mr-1 text-gray-500" />
                      Main File Path <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="/src/index.js"
                      value={projectDetails.filePath}
                      onChange={(e) => setProjectDetails({...projectDetails, filePath: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1  items-center">
                      <FileText size={16} className="mr-1 text-gray-500" />
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="E-commerce, SaaS, Portfolio"
                      value={projectDetails.projectType}
                      onChange={(e) => setProjectDetails({...projectDetails, projectType: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1  items-center">
                      <Globe size={16} className="mr-1 text-gray-500" />
                      Live Demo URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="https://project.vercel.app"
                      value={projectDetails.demoUrl}
                      onChange={(e) => setProjectDetails({...projectDetails, demoUrl: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1  items-center">
                      <FileText size={16} className="mr-1 text-gray-500" />
                      Project Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      placeholder="A brief description of your project..."
                      value={projectDetails.description}
                      onChange={(e) => setProjectDetails({...projectDetails, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="mt-5">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-300 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle size={18} className="mr-1" />
                    Submit Project for Analysis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Claude-style input area (positioned at bottom) */}
      <div className="absolute -bottom-8 left-0 right-0 p-4 transform translate-y-0 transition-transform duration-200 ease-in-out">
        <form onSubmit={handleSendMessage} className="bg-white rounded-t-xl shadow-lg border border-gray-200">
          <div className="flex items-start p-2">
            <button 
              type="button" 
              className="p-2 text-gray-400 rounded-full hover:bg-gray-100 mt-1"
              onClick={modalOpen}
            >
              <ProjectorIcon size={20} />
            </button>
            
            <div className="flex-1 mx-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                className="w-full p-2 bg-transparent outline-none resize-none min-h-14 max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center">
              <button 
                type="button" 
                className="p-2 text-gray-400 rounded-full hover:bg-gray-100 mr-1"
              >
                <Paperclip size={20} />
              </button>
              
              <button
                type="submit"
                className={`p-2 rounded-full flex items-center justify-center ${
                  !input.trim() || isLoading
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;