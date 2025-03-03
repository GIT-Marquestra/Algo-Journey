// hooks/useSocketWithStore.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useContestStore, { QuestionPar } from '@/app/store/useContestStore';

// Define types for socket communication
interface ServerToClientEvents {
  contestUpdate: (data: { questions: QuestionPar[] }) => void;
  entrySubmitted: (data: { entryId: string }) => void;
}

interface ClientToServerEvents {
  addQuestion: ({ q, contestId }: { q: any; contestId: number }) => void;
  submitEntry: (data: { questions: any[] }) => void;
}

export type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocketWithStore = () => {
  const socketRef = useRef<SocketType | null>(null);
  const { setIsConnected, addQuestions } = useContestStore();

  useEffect(() => {
    // Create socket connection
    const socketInstance: SocketType = io("http://localhost:4000", {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // Set up event listeners
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

    socketInstance.on("contestUpdate", (data) => {
      console.log("Received contest update:", data);
      if (Array.isArray(data.questions)) {
        addQuestions(data.questions);
      } else {
        console.error("Invalid data format received from contestUpdate:", data);
      }
    });

    socketRef.current = socketInstance;

    // Cleanup function
    return () => {
      socketInstance.disconnect();
    };
  }, [setIsConnected, addQuestions]);

  return socketRef.current;
};