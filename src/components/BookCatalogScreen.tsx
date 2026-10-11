import React, { useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { COVER_IMAGE, STORY_TITLE, STORY_TITLE_KR } from '../data/storyData';

interface BookCatalogScreenProps {
  badgeCount: number;
  onBackToFinal: () => void;
  onSelectCurrentBook: () => void;
}

interface VirtualBook {
  id: string;
  title: string;
  titleKr: string;
  isCurrent: boolean;
  coverImage?: string;
  emojiIcon: string;
  themeColor: string;
}

export const BookCatalogScreen: React.FC<BookCatalogScreenProps> = ({
  badgeCount,
  onBackToFinal,
  onSelectCurrentBook,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const books: VirtualBook[] = [
    {
      id: 'max',
      title: STORY_TITLE,
      titleKr: STORY_TITLE_KR,
      isCurrent: true,
      coverImage: COVER_IMAGE,
      emojiIcon: '🐶',
      themeColor: 'amber',
    },
    {
      id: 'milo',
      title: "Milo's Secret Treehouse",
      titleKr: '마일로의 비밀 오두막',
      isCurrent: false,
      emojiIcon: '🐱',
      themeColor: 'emerald',
    },
    {
      id: 'cookie',
      title: 'The Mystery of the Missing Cookie',
      titleKr: '사라진 쿠키의 수수께끼',
      isCurrent: false,
      emojiIcon: '🍪',
      themeColor: 'rose',
    },
  ];

  const handleBookClick = (book: VirtualBook) => {
    if (book.isCurrent) {
      onSelectCurrentBook();
    } else {
      setToastMessage(`"${book.title}" is coming soon! (곧 출시될 예정이에요!)`);
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-4 py-4">
      {/* Top Bar with Back button and Cumulative Badges */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
        <button
          onClick={onBackToFinal}
          className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back (뒤로 가기)</span>
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm shadow-xs">
          <span>🏅</span>
          <span className="tabular-nums font-extrabold">{badgeCount} Badges</span>
        </div>
      </div>

      {/* Title */}
      <div className="py-3 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mb-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Library Collection</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 font-story">
          Choose a Book (동화책 도서관)
        </h1>
        <p className="text-xs text-slate-500 font-korean mt-0.5">
          읽고 싶은 그림책을 골라 재미있는 독서를 시작해보세요!
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 p-3 rounded-2xl text-xs sm:text-sm font-bold text-center shadow-md animate-in fade-in duration-200 mb-2">
          <span>🔔 {toastMessage}</span>
        </div>
      )}

      {/* 3 Virtual Books Grid */}
      <div className="flex-1 space-y-3.5 overflow-y-auto py-1">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => handleBookClick(book)}
            className={`p-3.5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
              book.isCurrent
                ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-400/20 hover:bg-amber-50'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:bg-slate-50'
            }`}
          >
            {/* Book Cover Visual */}
            <div className="w-20 h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm relative bg-slate-100 flex items-center justify-center">
              <div className="text-center p-2">
                <span className="text-3xl block">{book.emojiIcon}</span>
              </div>
              {book.isCurrent && (
                <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                  Active
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {book.isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Current (읽기 가능)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    <Clock className="w-3 h-3" />
                    <span>Coming Soon (준비 중)</span>
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-story leading-snug">
                {book.title}
              </h3>
              <p className="text-xs font-bold text-slate-500 font-korean mt-0.5">
                {book.titleKr}
              </p>
              <p className="text-[11px] text-slate-400 font-story mt-1">
                {book.isCurrent ? '10 pages • CEFR A1' : 'New Storybook • Coming soon'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Back Button */}
      <div className="pt-3">
        <button
          onClick={onBackToFinal}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-xs transition-colors cursor-pointer"
        >
          Back to Finish Screen (완료 화면으로)
        </button>
      </div>
    </div>
  );
};
