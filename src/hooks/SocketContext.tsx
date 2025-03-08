'use client'
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, SetStateAction, Dispatch } from "react";
import { Difficulty } from "@prisma/client";
import { io, Socket } from "socket.io-client";
import useStore from "@/store/store";

// export interface Contest {
//   id: string;
//   questions: QuestionOnContest[];
//   startTime: string;
//   endTime: string;
//   duration: number;
// }

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
  points: number
  difficulty: Difficulty;
}

// Define types for socket communication
interface ServerToClientEvents {
  contestUpdate: (data: { questions: { questions: QuestionPar[] } }) => void;
  entrySubmitted: (data: { entryId: string }) => void;
}

interface ClientToServerEvents {
  addQuestion: ({ q, contestId }: { q: Question; contestId: number }) => void;
  submitEntry: (data: { questions: Question[] }) => void;
}

export type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: SocketType | null;
  questions: QuestionPar[];
  isConnected: boolean;
  setQuestions: Dispatch<SetStateAction<QuestionPar[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<SocketType | null>(null);
  const [questions, setQuestions] = useState<QuestionPar[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { setAddedQuestions } = useStore()

  const handleContestUpdate = useCallback((data: { questions: { questions: QuestionPar[] } }) => {

    setQuestions((prev) => [...prev, ...data.questions.questions]); 

    data.questions.questions.forEach((p) => {
      setAddedQuestions(p)
    })
    
  }, []);

  useEffect(() => {
    if (!socketRef.current) {
      // Create socket connection
      const socketInstance: SocketType = io("https://algojourneywebsocket-production.up.railway.app", {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketInstance.on("connect", () => {
        console.log("Socket connected to backend");
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected from backend");
        setIsConnected(false);
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Connection error: ", error);
        setIsConnected(false);
      });

      socketInstance.on("contestUpdate", handleContestUpdate);

      socketRef.current = socketInstance;
    }

    // Cleanup function
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [handleContestUpdate]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, questions, isConnected, setQuestions }}>
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