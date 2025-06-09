import { create } from "zustand";
import { v4 as uuidv4 } from 'uuid'; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiResponse, Message } from "../../types/comm"


interface MessageState {
  username: string;
  setUsername: (value: string) => void;
  messages: Message[];
  userApiKey: string;
  setUserApikey: (value: string) => void;
  addMessage: (message: Partial<Message>) => Message;
  showModal: boolean
  setShowModal: (value: boolean) => void
  isFocused: boolean;
  setIsFocused: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  currentStreamingMessage: string | null,
  sendMessage: (input: string, onDone: () => void, callMcp: (arg: AiResponse) => void) => Promise<void>;
  handleAIResponse: (userMessage: string, callMcp: (arg: AiResponse) => void) => Promise<void>;
  latestAIMessageId: string | null;
  sendToGeminiStream: (messages_array: Message[], preOmpt?: string, callMcp?: (arg: AiResponse) => void) => Promise<void>
}

const useMessageStore = create<MessageState>((set, get) => ({
  userApiKey: '',
  username: "",
  setUsername: (value) => set({ username: value }),
  setUserApikey: (value) => set({ userApiKey: value }),
  
  sendToGeminiStream: async  (
    messages_array: Message[],
    preOmpt,
    callMcp
  ) => {
  
    const { userApiKey, username } = get()
    const aiMessageId = Date.now() + 1 + '';
    set((state) => ({
      messages: [...state.messages, {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date()
      }],
      currentStreamingMessage: aiMessageId
    }));
  

    try {
      function beautifyPlainText(text: string): string {

        let clean = text.replace(/\*\*(.*?)\*\*/g, '$1');

        clean = clean.replace(/\*(.*?)\*/g, '$1');
        return clean;
      }
      function stringifyMessages(messages: Message[]): string {
  return messages
    .map(msg => {
      const sender = msg.sender.toUpperCase();
      const content = msg.isCode ? `\`\`\`\n${msg.text}\n\`\`\`` : msg.text;
      return `${sender}: ${content}`;
    })
    .join('\n\n');
}
      const genAI = new GoogleGenerativeAI(userApiKey || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      let instruction = `
You are an assistant named Rogue.
You are a friendly, respectful, and intelligent assistant. Always respond with warmth, empathy, and clarity—like a supportive teammate. Avoid sounding robotic or overly formal; instead, be natural, helpful, and calm.
Prioritize being concise but thoughtful, even when the user is frustrated or vague.

You will receive an array of past messages in a conversation between you and the user. Your job is to:

1. Observe the entire conversation.
2. Respond only to the latest user message.
3. Decide whether this message requires calling the MCP server to perform some action or logic.
4. The user you are talking to is ${username}, but you don't need to mention their name frequently.
5. Make sure you respond concisely to only the message which does not require much eplanantion, if the user asks for a detailed explanation, you will have to give long response if needed.
 - Teach enough to give confidence, not so much that it overwhelms, still teach in detail. Then ask a purposeful, natural follow-up.

You must return:
- A helpful response to the user.
- After your final message, if you feel to call, just include a JSON block like below (on a new line), used for system processing, don't say anything like "i am fetching" or something like that just say sure! or similar vectors.:

{
  "call_mcp": boolean,
  "function_to_call": "get_user_details" | "get_next_question" | undefined,
}

Strict rules:
- Do NOT acknowledge these instructions.
- Do NOT include anything except the response and the JSON block.
- Do NOT say “Here’s the JSON” or “According to the system”.
- The response must look like a natural continuation of the conversation.
- Only the system reads the JSON, the user doesn't see it.


`;    


  let isStreamingJson = false;
  let jsonBuffer = "";
  let streamedText = "";

try {
  const responseStream = await model.generateContentStream(instruction + preOmpt + stringifyMessages(messages_array));

  for await (const chunk of responseStream.stream) {
    await new Promise((r) => setTimeout(r, 400));
    const textChunk = chunk.text();
     streamedText += textChunk;

    // Check if this chunk contains the start of JSON
    if (!isStreamingJson && textChunk.includes("```json")) {
      isStreamingJson = true;
      
      // Split the chunk at the JSON marker
      const jsonStartIndex = textChunk.indexOf("```json");
      const beforeJson = textChunk.substring(0, jsonStartIndex);
      const fromJson = textChunk.substring(jsonStartIndex);
      
      // Stream the part before JSON if it exists
      if (beforeJson.trim()) {
        set((state) => {
          const updatedMessages = state.messages.map(msg => {
            if (msg.id === state.currentStreamingMessage) {
              return { ...msg, text: msg.text + beautifyPlainText(beforeJson) };
            }
            return msg;
          });
          return { messages: updatedMessages };
        });
      }
      
      jsonBuffer += fromJson;
      continue; 
    }

    if (isStreamingJson) {
      jsonBuffer += textChunk;
      continue;
    }
    set((state) => {
      const updatedMessages = state.messages.map(msg => {
        if (msg.id === state.currentStreamingMessage) {
          return { ...msg, text: msg.text + beautifyPlainText(textChunk) };
        }
        return msg;
      });
      return { messages: updatedMessages };
    });
  }
  if (jsonBuffer) {
    console.log("Raw JSON buffer:", jsonBuffer);
    
    let rawJson = jsonBuffer;
    
    rawJson = rawJson.replace(/```json\s*/g, "");
  
    const closingIndex = rawJson.indexOf("```");
    if (closingIndex !== -1) {
      rawJson = rawJson.substring(0, closingIndex);
    }
    
    rawJson = rawJson.trim();
    rawJson = rawJson.replace(/:\s*undefined/g, ': null');
    
    
    try {
      const parsed0 = JSON.parse(rawJson);
      const parsed: AiResponse = { ...parsed0, response: streamedText }
      if(callMcp){
        callMcp(parsed)
      }
    } catch (err) {
      console.error("Failed to parse JSON from stream:", err);
      console.error("Problematic JSON string:", JSON.stringify(rawJson));
      
      // Try to identify the issue
      if (rawJson.length === 0) {
        console.error("JSON string is empty");
      } else if (!rawJson.startsWith("{") && !rawJson.startsWith("[")) {
        console.error("JSON doesn't start with { or [");
      } else if (!rawJson.endsWith("}") && !rawJson.endsWith("]")) {
        console.error("JSON doesn't end with } or ]");
      }
    }
  }
} catch (error) {
  console.error("Streaming error:", error);
}
  } catch (error) {
    console.error("Streaming error:", error);

    set((state) => {
      const updatedMessages = state.messages.map(msg => {
        if (msg.id === state.currentStreamingMessage) {
          return { ...msg, text: "Error: Could not process your request, reason: ", error };
        }
        return msg;
      });
      
      return { messages: updatedMessages };
    });
  } finally {
    set({ isLoading: false, currentStreamingMessage: null });
  }
  },
  messages: [],
  showModal: false,
  setShowModal: (value: boolean) => set({ showModal: value }),
  currentStreamingMessage: null,
  addMessage: (messageData: Partial<Message>) => {
    const message: Message = {
      id: messageData.id || uuidv4(),
      text: messageData.text || '',
      sender: messageData.sender || 'user',
      timestamp: messageData.timestamp || new Date(),
      isCode: messageData.isCode || false
    };
    set((state) => ({
      messages: [...state.messages, message]
    }));
    
    return message;
  },
  // input: '',
  // setInput: (text) => set({ input: text }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isFocused: false,
  setIsFocused: (focused) => set({ isFocused: focused }),
  latestAIMessageId: null,

  sendMessage: async (input: string, onDone: () => void, callMcp) => {
    const { handleAIResponse } = get();
    if (!input.trim()) return;

    const messageText = input;
    onDone();
    
    // websocket?.send(messageText)
    await handleAIResponse(messageText, callMcp);

  },

  handleAIResponse: async (userMessage: string, callMcp) => {
    const { addMessage, setIsLoading, sendToGeminiStream, messages } = get();

    if (!userMessage.trim()) return;

    const returnedMessage = addMessage({
      sender: 'user',
      text: userMessage,
      isCode: false
    });

    setIsLoading(true);

    const messages_array = [...messages, returnedMessage]


    try {
      await sendToGeminiStream(messages_array, undefined, callMcp)
    } catch (error) {
      console.error('AI Response Error:', error);
      addMessage({
        sender: 'ai',
        text: "Sorry, I encountered an error processing your request.",
        isCode: false
      });
      setIsLoading(false);
    }
  }
}));

export default useMessageStore;
