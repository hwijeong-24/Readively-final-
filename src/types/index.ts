export interface WordDefinition {
  word: string;
  matchText?: string;
  korean: string;
  phonetic?: string;
  meaningEn: string;
  exampleSentence: string;
  iconName: string;
}

export interface StorySentence {
  id: string;
  text: string;
}

export interface StoryPage {
  pageNumber: number;
  image: string;
  imageAlt: string;
  counterpointNote: string;
  sentences: StorySentence[];
  underlinedWords: WordDefinition[];
}

export interface InferenceQuestion {
  id: string;
  afterPage: number;
  question: string;
  questionKr: string;
  type: 'feeling' | 'prediction';
  questionUnderlinedWord: WordDefinition;
  choices: string[];
  correctIndex: number;
  hint: string;
  hintKr: string;
  explanation: string;
  explanationKr: string;
}

export interface ReadingFeedback {
  practiceWords: string[];
  feedbackMessage: string;
  koreanTip: string;
  rating: number;
  allWordsMatched: boolean;
  studentTranscript: string;
  audioBlobUrl?: string;
  timestamp: number;
}

export interface WordBankItem extends WordDefinition {
  addedAt: number;
  pageNumber: number;
}

export interface StoryStage {
  id: string;
  stageName: 'Beginning' | 'Development' | 'Turn' | 'Ending';
  stageNameKr: string;
  title: string;
  summary: string;
  image: string;
  pageNumbers: number[];
}

export type EmotionType = 'happy' | 'sad' | 'surprised' | 'interested';

export interface EmotionOption {
  type: EmotionType;
  emoji: string;
  label: string;
  labelKr: string;
  becauseOptions: string[];
}
