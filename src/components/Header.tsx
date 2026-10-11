import React from 'react';
import { Bookmark, Home, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  currentPage: number;
  totalPages: number;
  isCover: boolean;
  isResult: boolean;
  isQuestion: boolean;
  isRebuilder?: boolean;
  isCatalog?: boolean;
  wordBankCount: number;
  badgeCount: number;
  soundEnabled: boolean;
  onOpenWordBank: () => void;
  onToggleSound: () => void;
  onOpenHomeConfirm: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  totalPages,
  isCover,
  isResult,
  isQuestion,
  isRebuilder = false,
  isCatalog = false,
  wordBankCount,
  badgeCount,
  soundEnabled,
  onOpenWordBank,
  onToggleSound,
  onOpenHomeConfirm,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100/80 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs">
      {/* Left Slot: Home Button (on every screen except Cover) & Page Counter/Title */}
      <div className="flex items-center gap-2 min-w-0">
        {!isCover && (
          <button
            onClick={onOpenHomeConfirm}
            aria-label="Home"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center text-slate-700 hover:text-amber-800 hover:bg-amber-100/80 active:scale-95 transition-all cursor-pointer border border-amber-200/60 shadow-2xs shrink-0"
            title="홈으로 돌아가기 (처음부터 읽기)"
          >
            <Home className="w-5 h-5 text-amber-700" />
          </button>
        )}
        {isCover ? (
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold text-amber-600 tracking-tight font-story">
              Readively
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              초등 5-6학년 영어 그림책
            </span>
          </div>
        ) : isResult ? (
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-story truncate">
              Story Complete!
            </span>
          </div>
        ) : isRebuilder ? (
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs sm:text-sm font-bold text-indigo-800 font-story truncate">
              Story Rebuilder
            </span>
          </div>
        ) : isCatalog ? (
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-story truncate">
              Choose a Book
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums font-story">
              Page {currentPage} / {totalPages}
            </span>
            {isQuestion && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
                그림 추론 퀴즈
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Slot: Badge count, Word Bank button, Sound toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div
          className="h-8 sm:h-9 px-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center gap-1 text-xs font-black shadow-2xs"
          title="누적 획득 배지 수"
        >
          <span>🏅</span>
          <span className="tabular-nums font-extrabold">{badgeCount}</span>
        </div>
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={soundEnabled ? '오디오 켜짐' : '오디오 꺼짐'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-slate-700" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <button
          onClick={onOpenWordBank}
          className="h-9 px-2.5 sm:px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 flex items-center gap-1.5 transition-colors text-xs font-bold cursor-pointer"
          title="단어장 열기"
        >
          <Bookmark className="w-4 h-4 text-amber-600 fill-amber-500/20" />
          <span className="hidden sm:inline">단어장</span>
          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
            {wordBankCount}
          </span>
        </button>
      </div>
    </header>
  );
};
