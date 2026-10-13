import React, { useState, useEffect, useRef } from 'react';
import { StoryPage, WordDefinition, ReadingFeedback, StorySentence } from '../types';
import { Mic, MicOff, Volume2, ArrowLeft, ArrowRight, Star, RotateCcw, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  speakText,
  stopSpeaking,
  startSpeechRecognition,
  startAudioWithVolumeDetection,
  validateSpeechRecording,
  evaluateReading,
  SpeechRecognitionController,
  AudioRecorderController,
  AudioRecordingResult,
} from '../utils/speech';
import { sounds } from '../utils/soundEffects';
import { StoryIllustration } from './StoryIllustration';

interface StoryPageScreenProps {
  page: StoryPage;
  totalPages: number;
  readSentenceIds: Set<string>;
  sentenceFeedbacks: Record<string, ReadingFeedback>;
  savedWordMap: Set<string>;
  soundEnabled: boolean;
  onSentenceRead: (sentenceId: string, feedback: ReadingFeedback) => void;
  onSelectWord: (word: WordDefinition) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const StoryPageScreen: React.FC<StoryPageScreenProps> = ({
  page,
  readSentenceIds,
  sentenceFeedbacks,
  savedWordMap,
  onSentenceRead,
  onSelectWord,
  onNextPage,
  onPrevPage,
}) => {
  // Active sentence being read/focused
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const activeSentence: StorySentence = page.sentences[activeSentenceIndex] || page.sentences[0];

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isPlayingModel, setIsPlayingModel] = useState<boolean>(false);
  const [isPlayingStudent, setIsPlayingStudent] = useState<boolean>(false);
  const [silenceDetected, setSilenceDetected] = useState<boolean>(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  // Controllers
  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const audioRecorderRef = useRef<AudioRecorderController | null>(null);
  const studentAudioRef = useRef<HTMLAudioElement | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const recordingTargetIndexRef = useRef<number>(0);

  // Check if all sentences on this page have been read
  const allSentencesRead = page.sentences.every((s) => readSentenceIds.has(s.id));
  const currentSentenceFeedback = sentenceFeedbacks[activeSentence.id];

  // Identify next unread sentence index
  const nextUnreadSentenceIndex = page.sentences.findIndex(
    (s, idx) => idx > activeSentenceIndex && !readSentenceIds.has(s.id)
  );

  // Reset audio & select first unread sentence on page change
  useEffect(() => {
    stopSpeaking();
    if (studentAudioRef.current) {
      studentAudioRef.current.pause();
    }
    const firstUnread = page.sentences.findIndex((s) => !readSentenceIds.has(s.id));
    if (firstUnread !== -1) {
      setActiveSentenceIndex(firstUnread);
      recordingTargetIndexRef.current = firstUnread;
    } else {
      setActiveSentenceIndex(0);
      recordingTargetIndexRef.current = 0;
    }
    setSilenceDetected(false);
    setMicPermissionDenied(false);
  }, [page.pageNumber]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopSpeaking();
    };
  }, []);

  // Start recording for a specific sentence index
  const handleStartRecording = async (targetIndex = activeSentenceIndex) => {
    stopSpeaking();
    setActiveSentenceIndex(targetIndex);
    recordingTargetIndexRef.current = targetIndex;
    setSilenceDetected(false);
    setMicPermissionDenied(false);
    setInterimTranscript('');
    latestTranscriptRef.current = '';

    try {
      audioRecorderRef.current = await startAudioWithVolumeDetection();
    } catch (err: any) {
      console.warn('Microphone permission or support issue:', err);
      setMicPermissionDenied(true);
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    sounds.playRecordStart();

    // Start Web Speech API transcription
    recognitionRef.current = startSpeechRecognition({
      onInterim: (text) => {
        setInterimTranscript(text);
        latestTranscriptRef.current = text;
      },
      onFinal: (text) => {
        setInterimTranscript(text);
        latestTranscriptRef.current = text;
        finishRecording(text, targetIndex);
      },
      onError: (err) => {
        console.warn('Speech recognition warning:', err);
      },
      onEnd: () => {
        // Will be handled in finishRecording
      },
    });
  };

  const handleStopRecording = async () => {
    let finalTrans = latestTranscriptRef.current;
    if (recognitionRef.current) {
      try {
        finalTrans = await recognitionRef.current.stop();
      } catch {}
    }
    finishRecording(finalTrans || latestTranscriptRef.current, recordingTargetIndexRef.current);
  };

  const finishRecording = async (transcript: string, sentenceIndex: number) => {
    if (!isRecording) return;
    sounds.playRecordStop();
    setIsRecording(false);
    setIsEvaluating(true);

    let audioResult: AudioRecordingResult = {
      blob: null,
      blobUrl: null,
      maxVolume: 0,
      averageVolume: 0,
      noiseFloor: 0.01,
      voiceDurationMs: 0,
      durationMs: 0,
      hasSound: false,
    };
    if (audioRecorderRef.current) {
      try {
        audioResult = await audioRecorderRef.current.stop();
      } catch (e) {
        console.warn('Audio recorder stop error:', e);
      }
    }

    // Call shared validation function
    const validation = validateSpeechRecording({
      transcript,
      durationMs: audioResult.durationMs,
      maxVolume: audioResult.maxVolume,
      noiseFloor: audioResult.noiseFloor,
      voiceDurationMs: audioResult.voiceDurationMs,
      recognitionSupported: recognitionRef.current?.isSupported() ?? true,
      recognitionError: recognitionRef.current?.getError(),
    });

    // When recording is INVALID:
    // Show NO feedback or praise, play NO AI reading automatically, do NOT mark sentence as read,
    // and do NOT enable Next button or move to next sentence.
    if (!validation.isValid) {
      setIsEvaluating(false);
      setSilenceDetected(true);
      return;
    }

    const target = page.sentences[sentenceIndex] || page.sentences[0];
    // Extract key words ONLY belonging to THIS specific target sentence
    const targetTokens = new Set(target.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
    const keyWordStrings = target.practiceWords && target.practiceWords.length > 0
      ? target.practiceWords
      : page.underlinedWords
          .filter((w) => (w.matchText || w.word).toLowerCase().split(/\s+/).every(tok => targetTokens.has(tok)))
          .map((w) => w.matchText || w.word);

    const feedback = await evaluateReading(
      target.text,
      transcript || target.text,
      keyWordStrings,
      audioResult.blobUrl || undefined
    );

    // Strictly ensure practice words belong to this sentence or use fixed practice words
    if (target.practiceWords && target.practiceWords.length > 0) {
      feedback.practiceWords = target.practiceWords;
      feedback.koreanTip = `"${target.practiceWords.join(', ')}" 발음에 유의하며 큰 소리로 따라 해보세요!`;
    } else {
      const sanitizedPracticeWords = (feedback.practiceWords || []).filter((w) =>
        w.toLowerCase().split(/\s+/).every(tok => targetTokens.has(tok))
      );
      feedback.practiceWords = sanitizedPracticeWords.length > 0
        ? sanitizedPracticeWords.slice(0, 2)
        : keyWordStrings.slice(0, 2);
    }

    setIsEvaluating(false);
    setActiveSentenceIndex(sentenceIndex);
    onSentenceRead(target.id, feedback);

    // Auto-play model reading of ONLY current sentence
    handlePlayModelReading(target.text);
  };

  const handlePlayModelReading = (text: string) => {
    setIsPlayingModel(true);
    speakText(text, {
      rate: 0.85,
      onEnd: () => setIsPlayingModel(false),
    });
  };

  const handlePlayStudentAudio = (url?: string) => {
    if (!url) return;
    if (studentAudioRef.current) {
      studentAudioRef.current.pause();
    }
    const audio = new Audio(url);
    studentAudioRef.current = audio;
    setIsPlayingStudent(true);
    audio.onended = () => setIsPlayingStudent(false);
    audio.play().catch(() => setIsPlayingStudent(false));
  };

  // Render sentence with clickable underlined words (supports multi-word phrases like "jumps in")
  const renderSentenceWithUnderlinedWords = (sentence: StorySentence, isActive: boolean) => {
    const text = sentence.text;
    
    // Sort words by phrase length descending so multi-word phrases match first
    const sortedDefs = [...page.underlinedWords].sort(
      (a, b) => (b.matchText || b.word).length - (a.matchText || a.word).length
    );

    // Escape regex special chars and build word/phrase pattern
    const pattern = sortedDefs
      .map((w) => (w.matchText || w.word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    if (!pattern) {
      return (
        <p className={`text-lg sm:text-xl leading-relaxed font-story transition-all ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>
          {text}
        </p>
      );
    }

    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchedText = match[0];
      const matchedDef = sortedDefs.find(
        (w) => (w.matchText || w.word).toLowerCase() === matchedText.toLowerCase()
      );

      if (matchedDef) {
        const isSaved = savedWordMap.has(matchedDef.word.toLowerCase());
        parts.push(
          <button
            key={match.index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectWord(matchedDef);
            }}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-md font-bold transition-all underline decoration-2 decoration-amber-400 underline-offset-4 cursor-pointer active:scale-95 ${
              isSaved
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
            title="단어를 터치하여 뜻 확인 및 단어장 저장"
          >
            {matchedText}
          </button>
        );
      } else {
        parts.push(matchedText);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <p
        className={`text-lg sm:text-xl leading-relaxed font-story transition-all ${
          isActive
            ? 'text-slate-900 font-semibold'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {parts}
      </p>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-3 py-2 sm:px-4">
      {/* Top half: Picture book illustration with shared MaxDog drawing */}
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-amber-200/60 bg-amber-50/50 shrink-0">
        <StoryIllustration pageNumber={page.pageNumber} />
      </div>

      {/* Bottom half: Story text sentences & Listen button below */}
      <div className="flex-1 flex flex-col justify-around py-2 gap-2">
        <div className="space-y-2">
          {page.sentences.map((sent, index) => {
            const isRead = readSentenceIds.has(sent.id);
            const isActive = index === activeSentenceIndex;
            return (
              <div
                key={sent.id}
                onClick={() => {
                  if (!isRecording) {
                    setActiveSentenceIndex(index);
                    setSilenceDetected(false);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-50/90 border-amber-300 shadow-xs ring-2 ring-amber-400/20'
                    : 'bg-white/80 border-slate-200/80 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {renderSentenceWithUnderlinedWords(sent, isActive)}
                  </div>
                  {isRead && (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>읽음</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Listen button located inside the bottom text area below story sentences */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => handlePlayModelReading(activeSentence.text)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer"
            title="선택한 문장을 원어민 음성으로 듣기"
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>Listen to Sentence (문장 듣기)</span>
          </button>
          {page.sentences.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Sentence {activeSentenceIndex + 1} of {page.sentences.length}</span>
            </div>
          )}
        </div>

        {/* Silence Detection Alert with clearly visible Record again button */}
        {silenceDetected && !isRecording && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-center gap-1.5 text-rose-700 font-bold text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>I couldn't hear you. Let's try again!</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-700 font-korean">
              소리가 들리지 않았어요. 마이크에 대고 문장을 또박또박 읽어볼까요?
            </p>
            <button
              onClick={() => handleStartRecording(activeSentenceIndex)}
              className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer font-korean"
            >
              <Mic className="w-4 h-4" />
              <span>Record again (다시 녹음하기)</span>
            </button>
          </div>
        )}

        {/* Microphone Permission Blocked Alert */}
        {micPermissionDenied && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Microphone Access Needed (마이크 권한 필요)</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 font-korean leading-relaxed">
              브라우저 상단의 마이크 권한을 허용해주세요. 권한을 켠 뒤 아래 버튼을 눌러보세요.
            </p>
            <button
              onClick={() => handleStartRecording(activeSentenceIndex)}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer font-korean"
            >
              <Mic className="w-4 h-4" />
              <span>Record again (다시 시도하기)</span>
            </button>
          </div>
        )}

        {/* AI Reading Coach Panel (Per-sentence, large readable text) */}
        {currentSentenceFeedback && !isRecording && !silenceDetected && (
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < currentSentenceFeedback.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-sm font-bold text-slate-800 ml-1">
                  AI Reading Coach
                </span>
                {page.sentences.length > 1 && (
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full ml-1">
                    Sentence {activeSentenceIndex + 1}
                  </span>
                )}
              </div>

              {/* Re-record button INSIDE the panel for the current sentence */}
              <button
                onClick={() => handleStartRecording(activeSentenceIndex)}
                className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                title="이 문장 다시 녹음하기"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Re-record</span>
              </button>
            </div>

            {/* Feedback message */}
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
              {currentSentenceFeedback.feedbackMessage}
            </p>

            {/* Practice Words belonging strictly to this current sentence */}
            {(() => {
              const activeSentenceTokens = new Set(
                activeSentence.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
              );
              const sentenceSpecificPracticeWords = (currentSentenceFeedback.practiceWords || []).filter((word) =>
                word.toLowerCase().split(/\s+/).every((tok) => activeSentenceTokens.has(tok))
              );

              if (sentenceSpecificPracticeWords.length === 0) return null;

              return (
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-slate-600 text-xs font-semibold font-korean">유의하며 읽을 단어:</span>
                  {sentenceSpecificPracticeWords.map((word, i) => (
                    <button
                      key={i}
                      onClick={() => speakText(word, { rate: 0.8 })}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>{word}</span>
                      <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Korean Pronunciation Tip */}
            <p className="text-xs sm:text-sm text-amber-900 font-korean bg-amber-50/80 p-2.5 rounded-xl leading-relaxed">
              💡 {currentSentenceFeedback.koreanTip}
            </p>

            {/* Audio Comparison Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handlePlayModelReading(activeSentence.text)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors font-korean cursor-pointer ${
                  isPlayingModel
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingModel ? '재생 중...' : '올바른 발음 확인'}</span>
              </button>
              {currentSentenceFeedback.audioBlobUrl && (
                <button
                  onClick={() => handlePlayStudentAudio(currentSentenceFeedback.audioBlobUrl)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                    isPlayingStudent
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>{isPlayingStudent ? '재생 중...' : '내 목소리 듣기'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Recording Pulse */}
        {isRecording && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-center space-y-2 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Listening... 문장을 소리 내어 크게 읽어보세요!</span>
            </div>
            {interimTranscript && (
              <p className="text-base font-story text-slate-800 italic">
                "{interimTranscript}"
              </p>
            )}
          </div>
        )}

        {isEvaluating && (
          <div className="bg-white border border-amber-200 rounded-2xl p-3 text-center text-xs text-amber-800 font-medium">
            <span>✨ AI 코치가 학생의 목소리를 분석하고 있어요...</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar (Previous, Record, Next) */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Previous Button (Hidden on page 1) */}
        {page.pageNumber > 1 ? (
          <button
            onClick={() => {
              sounds.playPageFlip();
              onPrevPage();
            }}
            className="h-11 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        ) : (
          <div className="w-20" />
        )}

        {/* Center CTA Button */}
        <div className="flex-1 flex justify-center">
          {isRecording ? (
            <button
              onClick={handleStopRecording}
              className="h-12 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <MicOff className="w-5 h-5 animate-bounce" />
              <span>Done Reading (읽기 완료)</span>
            </button>
          ) : silenceDetected || micPermissionDenied ? (
            <button
              onClick={() => handleStartRecording(activeSentenceIndex)}
              className="h-12 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all font-korean cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              <span>Record again (다시 녹음하기)</span>
            </button>
          ) : readSentenceIds.has(activeSentence.id) && nextUnreadSentenceIndex !== -1 ? (
            /* Show Record button for the next unread sentence */
            <button
              onClick={() => handleStartRecording(nextUnreadSentenceIndex)}
              className="h-12 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              <span>Record Sentence {nextUnreadSentenceIndex + 1} (다음 문장 녹음)</span>
            </button>
          ) : (
            <button
              onClick={() => handleStartRecording(activeSentenceIndex)}
              className={`h-12 px-6 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                readSentenceIds.has(activeSentence.id)
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>
                {readSentenceIds.has(activeSentence.id)
                  ? 'Re-record (다시 녹음)'
                  : 'Record (소리 내어 읽기)'}
              </span>
            </button>
          )}
        </div>

        {/* Next Button (Unlocked only after every sentence on the page is read) */}
        <button
          onClick={() => {
            if (allSentencesRead && !silenceDetected && !micPermissionDenied) {
              sounds.playPageFlip();
              onNextPage();
            }
          }}
          disabled={!allSentencesRead || silenceDetected || micPermissionDenied}
          className={`h-11 px-4 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            allSentencesRead && !silenceDetected && !micPermissionDenied
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 cursor-pointer active:scale-95'
              : 'bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed'
          }`}
          title={allSentencesRead ? '다음 페이지로 이동' : '이 페이지의 모든 문장을 먼저 소리 내어 읽어주세요'}
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
