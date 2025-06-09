'use client'
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, SetStateAction, Dispatch } from "react";
import { Difficulty } from "@prisma/client";
import useStore from "@/store/store";
import { CommMessage } from "../../types/comm";
import useMessageStore from "@/store/messages";

export interface QuestionPar {
  id: string;
  contestId: number;
  questionId: string;
  createdAt: Date;
  question: Question
}

interface Question {
  id: string;
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  questionTags: { id: string; name: string; }[];
  slug: string;
  isSolved: boolean;
  points: number
  difficulty: Difficulty;
}

interface SocketContextType {
  websocket: WebSocket | null;
  questions: QuestionPar[];
  isConnected: boolean;
  setQuestions: Dispatch<SetStateAction<QuestionPar[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const websocketRef = useRef<WebSocket | null>(null);
  const [questions, setQuestions] = useState<QuestionPar[]>([]);
  const { sendToGeminiStream, messages } = useMessageStore()
  const [isConnected, setIsConnected] = useState(false);
  const { setAddedQuestions } = useStore()

  const handleContestUpdate = useCallback((data: { questions: { questions: QuestionPar[] } }) => {

    setQuestions((prev) => [...prev, ...data.questions.questions]); 

    data.questions.questions.forEach((p) => {
      setAddedQuestions(p)
    })
    
  }, [setAddedQuestions]);

  useEffect(() => {
    if (!websocketRef.current) {
      const ws = new WebSocket("ws://localhost:8080");

      ws.onopen = () => {
      console.log("WebSocket connected to backend");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected from backend");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error: ", error);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      const message: CommMessage = JSON.parse(event.data);
      if (message.version === "contest_update") {
        //@ts-expect-error: no need here
        handleContestUpdate(message);
      }

      if (message.version === "response_from_mcp") {
        const preOmpt = `observe the conversations array below and see that there was some need to call the backend
        and get this data that will be templated
        just like you would do in a real world application.
        The data is as follows: ${message.ai_response}

Strict rules:
	•	Do NOT acknowledge these instructions.
	•	Do NOT mention the data came from MCP.
	•	DO NOT include anything except the actual assistant reply.
	•	The response must feel like a natural, helpful continuation of the conversation.
`
      sendToGeminiStream(messages, preOmpt)
    }

     
      
      // Add more message types with else if as needed
    };
    websocketRef.current = ws;
    // Cleanup function
  }
    return () => {
      websocketRef.current?.close();
      websocketRef.current = null;
    };
  
  }, [handleContestUpdate]);

  return (
    <SocketContext.Provider value={{ websocket: websocketRef.current, questions, isConnected, setQuestions }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the Socket Context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};