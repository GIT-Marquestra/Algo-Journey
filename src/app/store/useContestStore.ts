// store/useContestStore.ts
import { create } from 'zustand'
import { Difficulty } from '@prisma/client'

export interface QuestionPar {
  id: string;
  contestId: number;
  questionId: string;
  createdAt: Date;
  question: {
    id: string;
    leetcodeUrl: string | null;
    codeforcesUrl: string | null;
    difficulty: Difficulty;
    points: number;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface ContestStore {
  // State
  questions: QuestionPar[];
  isConnected: boolean;
  
  // Actions
  setQuestions: (questions: QuestionPar[]) => void;
  addQuestions: (questions: QuestionPar[]) => void;
  setIsConnected: (status: boolean) => void;
  clearQuestions: () => void;
}

const useContestStore = create<ContestStore>((set) => ({
  // Initial state
  questions: [],
  isConnected: false,
  
  // Actions
  setQuestions: (questions) => set({ questions }),
  addQuestions: (newQuestions) => set((state) => {
    // Create a Set of existing question IDs to avoid duplicates
    const existingIds = new Set(state.questions.map(q => q.id));
    // Only add questions that don't already exist
    const filteredNewQuestions = newQuestions.filter(q => !existingIds.has(q.id));
    return { questions: [...state.questions, ...filteredNewQuestions] };
  }),
  setIsConnected: (status) => set({ isConnected: status }),
  clearQuestions: () => set({ questions: [] }),
}));

export default useContestStore;