// providers/SocketProvider.tsx
'use client';

import { PropsWithChildren, useEffect } from 'react';
import { io } from 'socket.io-client';
import useContestStore from '@/app/store/useContestStore';

export function SocketProvider({ children }: PropsWithChildren) {
  const { setIsConnected, addQuestions } = useContestStore();

  useEffect(() => {
    const socket = io("http://localhost:4000", {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket connected to backend");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected from backend");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error: ", error);
      setIsConnected(false);
    });

    socket.on("contestUpdate", (data) => {
      console.log("Received contest update:", data);
      if (Array.isArray(data.questions)) {
        addQuestions(data.questions);
      } else {
        console.error("Invalid data format received from contestUpdate:", data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [setIsConnected, addQuestions]);

  return <>{children}</>;
}

export default SocketProvider;