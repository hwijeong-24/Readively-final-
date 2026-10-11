import React, { useState } from 'react';
import { InferenceQuestion, StoryPage, WordDefinition } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Volume2 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { speakText } from '../utils/speech';
import { StoryIllustration } from './StoryIllustration';

interface QuestionScreenProps {
  question: InferenceQuestion;
  page: StoryPage;
  answeredResult: { selectedIndex: number; isCorrect: boolean } | null;
  savedWordMap: Set<string>;
  onAnswerQuestion: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onSelectWord: (word: WordDefinition) => void;
  onPrevPage: () => void;
  onContinue: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  page,
  answeredResult,
  savedWordMap,
  onAnswerQuestion,
  onSelectWord,
  onPrevPage,
  onContinue,
}) => {
  const [disabledWrongChoices, setDisabledWrongChoices] = useState<number[]>([]);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [showGentleNudge, setShowGentleNudge] = useState<boolean>(false);
  const [resolvedLocally, setResolvedLocally] = useState<boolean>(false);
  const [wasAutoRevealed, setWasAutoRevealed] = useState<boolean>(false);

  const isResolved = answeredResult !== null || resolvedLocally;
  const isFirstTryCorrect = answeredResult?.isCorrect ?? false;

  const handleSelectChoice = (idx: number) => {
    if (isResolved || disabledWrongChoices.includes(idx)) return;
    const newAttempts = attemptCount + 1;
    setAttemptCount(newAttempts);

    if (idx === question.correctIndex) {
      // Correct!
      sounds.playSuccessChime();
      setResolvedLocally(true);
      setShowGentleNudge(false);
      const isFirstTry = newAttempts === 1;
      onAnswerQuestion(question.id, idx, isFirstTry);
    } else {
      // Wrong choice
      sounds.playGentleNudge();
      const updatedDisabled = [...disabledWrongChoices, idx];
      setDisabledWrongChoices(updatedDisabled);
      setShowGentleNudge(true);

      // If learner has picked all wrong choices, reveal automatically without praise
      if (updatedDisabled.length >= question.choices.length - 1) {
        setWasAutoRevealed(true);
        setResolvedLocally(true);
        setShowGentleNudge(false);
        onAnswerQuestion(question.id, question.correctIndex, false);
      }
    }
  };

  const handlePronounceQuestion = () => {
    speakText(question.question, { rate: 0.85 });
  };

  // Render question text with the underlined vocabulary word
  const renderQuestionWithUnderlinedWord = () => {
    const targetWord = question.questionUnderlinedWord;
    const text = question.question;
    const words = text.split(/\b/);

    return (
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug font-story">
        {words.map((chunk, i) => {
          const lower = chunk.toLowerCase().trim();
          const matchKey = (targetWord?.matchText || targetWord?.word || '').toLowerCase();
          if (targetWord && (lower === matchKey || (matchKey && lower.startsWith(matchKey)))) {
            const isSaved = savedWordMap.has(targetWord.word.toLowerCase());
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWord(targetWord);
                }}
                className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-md font-bold transition-all underline decoration-2 decoration-amber-500 underline-offset-4 cursor-pointer active:scale-95 ${
                  isSaved
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
                title="단어를 터치하여 뜻 확인 및 단어장 저장"
              >
                {chunk}
              </button>
            );
          }
          return <span key={i}>{chunk}</span>;
        })}
      </h2>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-3 py-2 sm:px-4">
      {/* Top half: Picture to inspect closely with shared MaxDog */}
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-amber-200/80 bg-amber-50/50 shrink-0">
        <StoryIllustration pageNumber={page.pageNumber} />
      </div>

      {/* Middle: Inference Question & Choices */}
      <div className="flex-1 flex flex-col justify-around py-3 gap-2">
        {/* Question Header Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-amber-200 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {renderQuestionWithUnderlinedWord()}
              <p className="text-xs font-semibold text-amber-700 font-korean mt-1">
                {question.questionKr}
              </p>
            </div>
            <button
              onClick={handlePronounceQuestion}
              aria-label="Listen to question"
              className="w-9 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Answer Choices */}
        <div className="space-y-2">
          {question.choices.map((choice, idx) => {
            const isCorrect = idx === question.correctIndex;
            const isWrongDisabled = disabledWrongChoices.includes(idx);

            let choiceStyle = 'bg-white hover:bg-amber-50/70 border-slate-200 text-slate-800';
            if (isResolved) {
              if (isCorrect) {
                choiceStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-400/30';
              } else if (isWrongDisabled) {
                choiceStyle = 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60';
              } else {
                choiceStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
              }
            } else if (isWrongDisabled) {
              choiceStyle = 'bg-rose-50 border-rose-200 text-rose-500 line-through cursor-not-allowed opacity-60';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectChoice(idx)}
                disabled={isResolved || isWrongDisabled}
                className={`w-full text-left p-3.5 rounded-2xl border text-base sm:text-lg font-story transition-all flex items-center justify-between gap-3 ${choiceStyle} ${
                  !isResolved && !isWrongDisabled ? 'active:scale-98 cursor-pointer shadow-xs' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 text-sm font-bold flex items-center justify-center shrink-0 font-sans">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{choice}</span>
                </div>
                {isResolved && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 font-sans" />
                )}
              </button>
            );
          })}
        </div>

        {/* Gentle nudge when wrong answer is picked */}
        {showGentleNudge && !isResolved && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Not quite! Look at the picture clue and try again:</span>
            </div>
            <p className="font-story text-sm text-amber-900">{question.hint}</p>
            <p className="font-korean text-xs text-amber-800 mt-0.5">💡 {question.hintKr}</p>
          </div>
        )}

        {/* Full Explanation displayed only after resolved */}
        {isResolved && (
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm animate-in fade-in duration-200 ${
              isFirstTryCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : wasAutoRevealed
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {wasAutoRevealed ? (
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>
                {isFirstTryCorrect
                  ? 'Great job! You found the picture clue! (정답이에요!)'
                  : wasAutoRevealed
                  ? 'This is the answer! (정답은 이거예요!)'
                  : 'Well done for finding the clue! (단서를 잘 찾았어요!)'}
              </span>
            </div>
            <p className="font-story text-sm text-slate-800 leading-snug">{question.explanation}</p>
            <p className="font-korean text-xs text-amber-800 mt-1">💡 {question.explanationKr}</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            sounds.playPageFlip();
            onPrevPage();
          }}
          className="h-11 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Story</span>
        </button>

        <button
          onClick={() => {
            sounds.playPageFlip();
            onContinue();
          }}
          disabled={!isResolved}
          className={`h-11 px-5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            isResolved
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
