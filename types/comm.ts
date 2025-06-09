export interface CommMessage {
  version: "new_chat_room" | "message" | "config_update" | "system_ping" | "contest_update" | "response_from_mcp" | "ai_reply" | "get_user_details" | "get_next_question";
  sender: "system" | "user";
  user_apikey?: string;
  user_email?: string;
  ai_response?: string;
  messages?: Message[];
  config?: UserConfig;
  config_updated?: boolean
}

export interface UserConfig {
  explain_style: string;
  enforce_topic?: string; 
  honesty?: string;
  show_hints?: boolean;
  strictness?: "chill" | "moderate" | "high" | "very_high";
}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user' | 'system';
  timestamp: Date;
  isCode?: boolean;
}

export interface AiResponse {
  call_mcp: boolean;
  function_to_call?: "get_user_details" | "get_next_question";
  response: string 
}
