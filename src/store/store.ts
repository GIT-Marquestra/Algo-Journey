import { Contest } from "@/components/UpdateContest";
import { QuestionPar } from "@/hooks/SocketContext";
import { create } from "zustand";

// Define the type for the store
interface StoreState {
  flag: boolean;
  setFlag: (value: boolean) => void;
  contest: Contest | null;
  addedQuestions: QuestionPar[];
  setAddedQuestions: (v: QuestionPar) => void;
  setContest: (v: Contest | null) => void;
}

const useStore = create<StoreState>((set) => ({
  flag: false, // Initial state
  addedQuestions: [],
  contest: null,
  setAddedQuestions: (v) => set((state) => ({ addedQuestions: [...state.addedQuestions, v] })),
  setContest: (v) => set({ contest: v }),
  setFlag: (value) => set({ flag: value }), // Setter function
}));

export default useStore;