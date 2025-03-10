"use client";
import { useEffect, useRef, useState } from "react";

export const AITypingEffect = ({
  text,
  duration = 0.01,
  className = "",
}: {
  text: string;
  className?: string;
  duration?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Handle the typing effect
  useEffect(() => {
    // Skip if already completed
    if (completedRef.current) return;
    
    // Reset displayed text when text changes
    setDisplayedText("");
    
    if (!text) return;
    
    const characters = text.split("");
    let currentText = "";
    const timeouts: NodeJS.Timeout[] = [];

    characters.forEach((char, index) => {
      const timeout = setTimeout(() => {
        currentText += char;
        setDisplayedText(currentText);
        
        // Auto-resize textarea
        if (textAreaRef.current) {
          textAreaRef.current.style.height = "auto";
          textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
        
        // Check if we've reached the end of the text
        if (index === characters.length - 1) {
          completedRef.current = true;
          setCompleted(true);
        }
      }, index * (duration * 1000));
      
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [text, duration]);

  // If completed on mount, show full text immediately
  useEffect(() => {
    if (completed && text) {
      setDisplayedText(text);
      
      // Make sure textarea is sized correctly for full text
      if (textAreaRef.current) {
        setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
          }
        }, 0);
      }
    }
  }, [completed, text]);

  return (
    <div className={`w-full ${className}`}>
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