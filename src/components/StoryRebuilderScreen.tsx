import React, { useState, useRef } from 'react';
import { StoryStage } from '../types';
import { STORY_STAGES, STORY_PAGES } from '../data/storyData';
import { ArrowLeft, BookOpen, Volume2, Sparkles, CheckCircle2, GripVertical } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';
import { sounds } from '../utils/soundEffects';
import { StoryIllustration } from './StoryIllustration';

interface StoryRebuilderScreenProps {
  onBackToResult: () => void;
  onFinishRebuilder: () => void;
}

export const StoryRebuilderScreen: React.FC<StoryRebuilderScreenProps> = ({
  onBackToResult,
  onFinishRebuilder,
}) => {
  const [stages, setStages] = useState<StoryStage[]>(() => [...STORY_STAGES]);
  const [isReadingCustomBook, setIsReadingCustomBook] = useState<boolean>(false);
  const [customPageIndex, setCustomPageIndex] = useState<number>(0);

  // Drag and drop state
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverTargetIdx, setHoverTargetIdx] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pointer event handlers for cross-platform drag and drop (mouse & touch)
  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    // Only primary button
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingIdx(index);
    setHoverTargetIdx(index);
    sounds.playWordAdd();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null) return;
    e.preventDefault();
    const clientY = e.clientY;

    let closestIndex = draggingIdx;
    let minDistance = Infinity;

    cardRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - centerY);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    if (closestIndex !== hoverTargetIdx) {
      setHoverTargetIdx(closestIndex);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIdx === null) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (hoverTargetIdx !== null && hoverTargetIdx !== draggingIdx) {
      const updated = [...stages];
      const [moved] = updated.splice(draggingIdx, 1);
      updated.splice(hoverTargetIdx, 0, moved);
      setStages(updated);
      sounds.playSuccessChime();
    }

    setDraggingIdx(null);
    setHoverTargetIdx(null);
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
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-3 py-3 sm:px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
        <button
          onClick={() => {
            stopSpeaking();
            onBackToResult();
          }}
          className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Result</span>
        </button>
        <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-sm font-story">
          <Sparkles className="w-4 h-4" />
          <span>Story Rebuilder (이야기 다시 짓기)</span>
        </div>
      </div>

      {/* Main Content */}
      {!isReadingCustomBook ? (
        <div className="flex-1 py-3 overflow-y-auto space-y-3">
          <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-950 font-story">
              Drag and drop cards into any order!
            </h3>
            <p className="text-xs text-indigo-800 font-korean mt-0.5">
              카드를 드래그하여 이야기 순서를 바꾼 뒤 나만의 특별한 그림책을 만들어보세요.
            </p>
          </div>

          {/* Draggable Card List with touch-action: none during drag */}
          <div
            ref={containerRef}
            className={`space-y-3 ${draggingIdx !== null ? 'select-none touch-none' : ''}`}
          >
            {stages.map((stage, idx) => {
              const isBeingDragged = draggingIdx === idx;
              const isDropHover = hoverTargetIdx === idx && draggingIdx !== null && draggingIdx !== idx;

              return (
                <div
                  key={stage.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  onPointerDown={(e) => handlePointerDown(e, idx)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{ touchAction: 'none' }}
                  className={`relative p-3.5 sm:p-4 rounded-3xl border-2 transition-all flex items-center gap-3.5 cursor-grab active:cursor-grabbing ${
                    isBeingDragged
                      ? 'bg-indigo-50 border-indigo-500 shadow-2xl scale-102 ring-4 ring-indigo-400/25 z-30 opacity-95'
                      : isDropHover
                      ? 'bg-amber-50/70 border-indigo-400 border-dashed shadow-md ring-2 ring-indigo-300'
                      : 'bg-white border-slate-200/90 hover:border-indigo-200 hover:bg-slate-50/60 shadow-xs'
                  }`}
                >
                  {/* Drop indicator bar */}
                  {isDropHover && (
                    <div className="absolute -top-2 left-4 right-4 h-1 bg-indigo-500 rounded-full animate-pulse pointer-events-none" />
                  )}

                  {/* Stage Image with shared MaxDog */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                    <StoryIllustration pageNumber={stage.pageNumbers[0]} aspectRatio="1/1" />
                  </div>

                  {/* ONE full summary sentence - NO truncation, NO subtitles */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-base sm:text-lg font-bold text-slate-900 font-story leading-snug whitespace-normal break-words">
                      {stage.summary}
                    </p>
                  </div>

                  {/* Drag Grip Affordance */}
                  <div
                    className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 shrink-0"
                    title="Drag to rearrange"
                  >
                    <GripVertical className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={handleMakeMyBook}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer font-story"
            >
              <BookOpen className="w-5 h-5" />
              <span>Make My Book (나만의 책 완성하기)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Custom Reader Mode */
        <div className="flex-1 py-2 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full">
              My Custom Book: Page {customPageIndex + 1} / {customPages.length}
            </span>
            <button
              onClick={() => {
                stopSpeaking();
                setIsReadingCustomBook(false);
              }}
              className="text-xs text-indigo-700 hover:text-indigo-900 underline font-semibold cursor-pointer"
            >
              순서 다시 편집하기
            </button>
          </div>

          {/* Illustration with shared MaxDog */}
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-indigo-200 shadow-md bg-amber-50/50">
            <StoryIllustration pageNumber={currentCustomPage.pageNumber} aspectRatio="4/3" />
          </div>

          {/* Text sentences */}
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-1.5">
            {currentCustomPage.sentences.map((sent) => (
              <p key={sent.id} className="text-base sm:text-lg font-bold text-slate-900 font-story">
                {sent.text}
              </p>
            ))}
            <button
              onClick={handleReadCurrentCustomPage}
              className="mt-2 px-3.5 py-1.5 bg-white text-indigo-900 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200 shadow-xs cursor-pointer font-korean"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>소리 듣기</span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                stopSpeaking();
                setCustomPageIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={customPageIndex === 0}
              className="h-11 px-4 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Previous
            </button>

            {customPageIndex < customPages.length - 1 ? (
              <button
                onClick={() => {
                  stopSpeaking();
                  setCustomPageIndex((prev) => prev + 1);
                }}
                className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Next Page
              </button>
            ) : (
              <button
                onClick={() => {
                  stopSpeaking();
                  sounds.playSuccessChime();
                  onFinishRebuilder();
                }}
                className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer font-korean"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>완독 완료!</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
