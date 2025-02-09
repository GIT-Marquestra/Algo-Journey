export enum Difficulty {
    BEGINNER = "BEGINNER",
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
    VERYHARD = "VERYHARD"
  }
  
  export interface QuestionTag {
    id: string;
    name: string;
  }
  
  export interface Question {
    id: string;
    leetcodeUrl?: string | null;
    codeforcesUrl?: string | null;
    difficulty: Difficulty;
    points: number;
    questionTags?: QuestionTag[];
    slug: string;
  }
  
  export interface QuestionOnContest {
    id: string;
    contestId: number;
    questionId: string;
    question: Question;
  }