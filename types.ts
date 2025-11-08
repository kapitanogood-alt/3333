export interface Question {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: keyof Question['options'];
  explanation: string;
}

export interface SubjectStats {
  total: number;
  correct: number;
  incorrect: number;
  score: number;
}

export interface AllStats {
  [subject: string]: SubjectStats;
}
