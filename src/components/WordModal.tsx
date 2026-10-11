import React from 'react';
import { WordDefinition } from '../types';
import { Volume2, Bookmark, Check, X, Shield, Eye, Ghost, Heart, Cookie, Apple, Sparkles, CheckCircle, CloudRain, Footprints, Target, Wind, Star, Smile, Check as CheckIcon, Clock, Sun, ShieldCheck, Zap, Home, Trees, Circle } from 'lucide-react';
import { speakText } from '../utils/speech';
import { sounds } from '../utils/soundEffects';

interface WordModalProps {
  word: WordDefinition | null;
  isInBank: boolean;
  onToggleBank: (word: WordDefinition) => void;
  onClose: () => void;
}

const ICONS: Record<string, React.ElementType> = {
  Shield,
  Eye,
  Ghost,
  Heart,
  Cookie,
  Apple,
  Sparkles,
  CheckCircle,
  CloudRain,
  Footprints,
  Target,
  Wind,
  Star,
  Smile,
  Check: CheckIcon,
  Clock,
  Sun,
  ShieldCheck,
  Zap,
  Home,
  Trees,
  Circle,
};

export const WordModal: React.FC<WordModalProps> = ({
  word,
  isInBank,
  onToggleBank,
  onClose,
}) => {
  if (!word) return null;

  const IconComponent = ICONS[word.iconName] || Star;

  const handlePronounce = () => {
    speakText(word.word, { rate: 0.8 });
  };

  const handleSave = () => {
    onToggleBank(word);
    sounds.playWordAdd();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-amber-100 flex flex-col gap-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
            <span>Vocabulary Card</span>
            <span>•</span>
            <span className="font-korean">초등 5-6학년 핵심 단어</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Word Hero & Icon */}
        <div className="flex items-center gap-4 bg-amber-50/60 rounded-2xl p-4 border border-amber-100/60">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <IconComponent className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 capitalize font-story">
              {word.word}
            </h3>
            <p className="text-base font-bold text-amber-700 font-korean mt-1">
              {word.korean}
            </p>
          </div>
          <button
            onClick={handlePronounce}
            aria-label="Listen to pronunciation"
            className="w-10 h-10 rounded-full bg-white hover:bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Meaning and Example */}
        <div className="space-y-2 text-sm">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">
              English Meaning
            </span>
            <p className="text-slate-700 leading-snug">{word.meaningEn}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">
              In this story
            </span>
            <p className="text-slate-800 italic font-story">
              "{word.exampleSentence}"
            </p>
          </div>
        </div>

        {/* Add to Word Bank CTA */}
        <button
          onClick={handleSave}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
            isInBank
              ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
              : 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600'
          }`}
        >
          {isInBank ? (
            <>
              <Check className="w-4 h-4" />
              <span>In Word Bank <span className="font-korean font-bold">(단어장에 보관됨)</span></span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              <span>+ Add to Word Bank <span className="font-korean font-bold">(단어장에 담기)</span></span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
