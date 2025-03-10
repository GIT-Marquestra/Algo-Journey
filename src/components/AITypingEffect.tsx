"use client";
import { useEffect, useRef, useState } from "react";

export const AITypingEffect = ({
  text,
  duration = 0.03,
}: {
  text: string;
  className?: string;
  duration?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDisplayedText("");
    
    if (!text) return;
    
    const characters = text.split("");
    let currentText = "";
    const timeouts: NodeJS.Timeout[] = [];

    characters.forEach((char, index) => {
      const timeout = setTimeout(() => {
        currentText += char;
        setDisplayedText(currentText);
        
        if (textAreaRef.current) {
          textAreaRef.current.style.height = "auto";
          textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
      }, index * (duration * 1000));
      
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [text, duration]);

  return (
    <div className="w-full">
      <textarea
        ref={textAreaRef}
        value={displayedText}
        readOnly
        className="w-full bg-transparent border-none outline-none resize-none overflow-hidden p-0"
        style={{ 
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          width: "100%",
        }}
      />
    </div>
  );
};