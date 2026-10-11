import React from 'react';
import { WordBankItem } from '../types';
import { X, Volume2, Trash2, BookOpen, Star } from 'lucide-react';
import { speakText } from '../utils/speech';

interface WordBankModalProps {
  savedWords: WordBankItem[];
  onRemoveWord: (word: string) => void;
  onClose: () => void;
}

export const WordBankModal: React.FC<WordBankModalProps> = ({
  savedWords,
  onRemoveWord,
  onClose,
}) => {
  const handlePronounce = (word: string) => {
    speakText(word, { rate: 0.8 });
  };

  const handlePronounceAll = () => {
    if (savedWords.length === 0) return;
    const wordsList = savedWords.map(w => w.word).join(', ');
    speakText(wordsList, { rate: 0.85 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl border border-amber-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-story">
                My Word Bank (나의 단어장)
              </h2>
              <p className="text-xs text-slate-500">
                {savedWords.length} words saved (저장된 단어)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedWords.length > 0 && (
              <button
                onClick={handlePronounceAll}
                className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="모든 단어 연속 듣기"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play All</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Word List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {savedWords.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                단어장이 비어 있어요!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                책을 읽으면서 밑줄 친 단어를 터치하면 여기에 저장되어 언제든 복습할 수 있어요.
              </p>
            </div>
          ) : (
            savedWords.map((item) => (
              <div
                key={item.word}
                className="bg-amber-50/50 hover:bg-amber-50 rounded-2xl p-3.5 border border-amber-100 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-slate-900 font-story capitalize">
                      {item.word}
                    </span>
                    <span className="text-xs text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/80 font-medium font-sans">
                      Page {item.pageNumber}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-amber-700 font-korean mt-1">
                    {item.korean}
                  </p>
                  <p className="text-xs text-slate-600 truncate mt-1">
                    "{item.exampleSentence}"
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handlePronounce(item.word)}
                    aria-label={`Listen to ${item.word}`}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveWord(item.word)}
                    aria-label={`Remove ${item.word}`}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>스피커 아이콘을 누르면 원어민 발음을 들을 수 있어요.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
