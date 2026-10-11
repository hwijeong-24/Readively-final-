import React, { useState } from 'react';
import { StoryStage } from '../types';
import { STORY_STAGES, STORY_PAGES } from '../data/storyData';
import { X, ArrowUp, ArrowDown, BookOpen, Volume2, Sparkles, Check } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';
import { sounds } from '../utils/soundEffects';

interface StoryRebuilderModalProps {
  onClose: () => void;
}

export const StoryRebuilderModal: React.FC<StoryRebuilderModalProps> = ({ onClose }) => {
  const [stages, setStages] = useState<StoryStage[]>(() => [...STORY_STAGES]);
  const [isReadingCustomBook, setIsReadingCustomBook] = useState<boolean>(false);
  const [customPageIndex, setCustomPageIndex] = useState<number>(0);

  const moveStage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= stages.length) return;
    const updated = [...stages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setStages(updated);
    sounds.playWordAdd();
  };

  // Compile the story pages in the new custom order
  const customPages = stages.flatMap((stage) =>
    stage.pageNumbers
      .map((pNum) => STORY_PAGES.find((p) => p.pageNumber === pNum))
      .filter((p): p is (typeof STORY_PAGES)[0] => !!p)
  );

  const currentCustomPage = customPages[customPageIndex] || customPages[0];

  const handleMakeMyBook = () => {
    sounds.playSuccessChime();
    setCustomPageIndex(0);
    setIsReadingCustomBook(true);
  };

  const handleReadCurrentCustomPage = () => {
    if (!currentCustomPage) return;
    const text = currentCustomPage.sentences.map((s) => s.text).join(' ');
    speakText(text, { rate: 0.85 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-indigo-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-story">
                Story Rebuilder (이야기 다시 짓기)
              </h2>
              <p className="text-[11px] text-slate-500">
                Rearrange the 4 story stages and make your own book!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!isReadingCustomBook ? (
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              화살표 버튼을 눌러 이야기 순서를 바꾼 뒤 <strong>Make My Book</strong>을 눌러보세요!
            </p>
            <div className="space-y-2.5">
              {stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="bg-indigo-50/40 hover:bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-xs"
                >
                  <img
                    src={stage.image}
                    alt={stage.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-indigo-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                        Stage {idx + 1}: {stage.stageName}
                      </span>
                      <span className="text-xs text-slate-400 font-korean">
                        {stage.stageNameKr}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 font-story mt-1 truncate">
                      {stage.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {stage.summary}
                    </p>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveStage(idx, idx - 1)}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveStage(idx, idx + 1)}
                      disabled={idx === stages.length - 1}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleMakeMyBook}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Make My Book (나만의 책 완성하기)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Custom Reader Mode */
          <div className="p-4 overflow-y-auto flex-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                Custom Story Page {customPageIndex + 1} / {customPages.length}
              </span>
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsReadingCustomBook(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                순서 편집하기
              </button>
            </div>

            {/* Text sentences */}
            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
              {currentCustomPage.sentences.map((sent) => (
                <p key={sent.id} className="text-base font-semibold text-slate-900 font-story mb-1">
                  {sent.text}
                </p>
              ))}
            </div>

            {/* Custom Reader navigation */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  stopSpeaking();
                  setCustomPageIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={customPageIndex === 0}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={handleReadCurrentCustomPage}
                className="px-4 py-2 bg-indigo-100 text-indigo-900 hover:bg-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>
              {customPageIndex < customPages.length - 1 ? (
                <button
                  onClick={() => {
                    stopSpeaking();
                    setCustomPageIndex((prev) => prev + 1);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Next Page
                </button>
              ) : (
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsReadingCustomBook(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finished!</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
