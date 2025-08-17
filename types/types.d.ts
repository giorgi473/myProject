export interface Person {
  name: string;
  age: number;
}

interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  vehicleType?: string;
  image: string;
  desc: string;
  _id: number;
  gadjet: string;
  answeringQuestion: string;
  answers: Answer[];
}

export interface VehicleCategory {
  id: string;
  label: string;
  icon: string;
  gadjet: string;
  categoryMappings: {
    [categoryName: string]: {
      questions: Question[];
    };
  };
}

export interface Category {
  id: number;
  name: string;
}

export interface ActiveCategory {
  id: number;
  name: string;
  tickets: number;
  main: Question[];
}
