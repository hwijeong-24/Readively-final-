import React from 'react';
import { BookOpen, Sparkles, Mic, Search, Smile } from 'lucide-react';
import { STORY_TITLE, STORY_TITLE_KR, STORY_SUBTITLE, STORY_AUTHOR } from '../data/storyData';
import { sounds } from '../utils/soundEffects';
import { StoryIllustration } from './StoryIllustration';

interface CoverScreenProps {
  onOpenBook: () => void;
  wordBankCount: number;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({ onOpenBook }) => {
  const handleOpen = () => {
    sounds.playPageFlip();
    onOpenBook();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full">
      {/* Top Banner Tag */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-korean">초등 5-6학년 영어 그림책</span>
        </div>
      </div>

      {/* Book Cover Container */}
      <div className="my-auto py-4 flex flex-col items-center">
        <div className="relative group w-full max-w-[280px] sm:max-w-[310px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-200/80 bg-amber-100">
          <StoryIllustration pageNumber="cover" aspectRatio="3/4" />
          {/* Spine ribbon effect */}
          <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-amber-900/30 to-transparent pointer-events-none" />
          {/* Overlay Tag */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-xs p-3 rounded-2xl shadow-lg border border-amber-200/60 text-center">
            <h1 className="text-xl font-extrabold text-amber-900 font-story leading-tight">
              {STORY_TITLE}
            </h1>
            <p className="text-sm font-bold text-amber-700 font-korean mt-0.5">
              {STORY_TITLE_KR}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              By {STORY_AUTHOR} • {STORY_SUBTITLE}
            </p>
          </div>
        </div>

        {/* 3 Step Learning Steps info */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center">
          <div className="bg-white/80 p-2 rounded-xl border border-amber-100 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-1">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 block font-korean">소리 내어 읽기</span>
            <span className="text-[10px] text-slate-500">Read Aloud</span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-amber-100 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1">
              <Search className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 block font-korean">그림 단서 추론</span>
            <span className="text-[10px] text-slate-500">Picture Inference</span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-amber-100 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1">
              <Smile className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 block font-korean">느낌 나누기</span>
            <span className="text-[10px] text-slate-500">Express Feelings</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pb-4">
        <button
          onClick={handleOpen}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-amber-500/30 transition-all font-story cursor-pointer"
        >
          <BookOpen className="w-6 h-6" />
          <span>Open the book <span className="font-korean text-base font-bold">(책 펼치기)</span></span>
        </button>
        <p className="text-center text-xs text-slate-500 mt-2 font-korean">
          그림 속 숨은 단서를 찾으며 재미있게 읽어보세요!
        </p>
      </div>
    </div>
  );
};
