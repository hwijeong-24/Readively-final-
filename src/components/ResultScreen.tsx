import React, { useState, useRef, useEffect } from 'react';
import { EmotionType, WordBankItem } from '../types';
import { EMOTION_OPTIONS } from '../data/storyData';
import { Award, BookOpen, Volume2, Mic, MicOff, Shuffle, CheckCircle, Heart, Play, AlertCircle } from 'lucide-react';
import {
  speakText,
  stopSpeaking,
  startSpeechRecognition,
  startAudioWithVolumeDetection,
  validateSpeechRecording,
  SpeechRecognitionController,
  AudioRecorderController,
  AudioRecordingResult,
} from '../utils/speech';
import { sounds } from '../utils/soundEffects';
import { MaxDog } from './MaxDog';
import { StoryIllustration } from './StoryIllustration';

interface ResultScreenProps {
  score: number;
  totalQuestions: number;
  savedWords: WordBankItem[];
  sentencesReadCount: number;
  totalSentencesCount: number;
  badgeCount: number;
  onOpenWordBank: () => void;
  onOpenStoryRebuilder: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  score,
  totalQuestions,
  savedWords,
  sentencesReadCount,
  totalSentencesCount,
  badgeCount,
  onOpenWordBank,
  onOpenStoryRebuilder,
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>('happy');
  const [selectedBecause, setSelectedBecause] = useState<string>(
    EMOTION_OPTIONS[0].becauseOptions[0]
  );

  // Recording state for reflection sentence
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecordedSuccessfully, setHasRecordedSuccessfully] = useState<boolean>(false);
  const [studentAudioBlobUrl, setStudentAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingModel, setIsPlayingModel] = useState<boolean>(false);
  const [isPlayingStudent, setIsPlayingStudent] = useState<boolean>(false);
  const [silenceError, setSilenceError] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const audioRecorderRef = useRef<AudioRecorderController | null>(null);
  const studentAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const latestTranscriptRef = useRef<string>('');

  const activeEmotionOption =
    EMOTION_OPTIONS.find((e) => e.type === selectedEmotion) || EMOTION_OPTIONS[0];

  const fullReflectionSentence = `I felt ${activeEmotionOption.label} because ${selectedBecause}`;

  // Reset recording state whenever user changes emoji or chip
  const resetRecordingState = () => {
    stopSpeaking();
    setHasRecordedSuccessfully(false);
    setStudentAudioBlobUrl(null);
    setSilenceError(false);
  };

  const handleSelectEmotion = (type: EmotionType) => {
    setSelectedEmotion(type);
    const option = EMOTION_OPTIONS.find((e) => e.type === type);
    if (option) {
      setSelectedBecause(option.becauseOptions[0]);
    }
    resetRecordingState();
  };

  const handleSelectBecause = (becauseText: string) => {
    setSelectedBecause(becauseText);
    resetRecordingState();
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleStartRecording = async () => {
    stopSpeaking();
    setSilenceError(false);
    latestTranscriptRef.current = '';

    try {
      audioRecorderRef.current = await startAudioWithVolumeDetection();
    } catch (e) {
      console.warn('Microphone start error in reflection:', e);
      setSilenceError(true);
      return;
    }

    setIsRecording(true);
    sounds.playRecordStart();

    recognitionRef.current = startSpeechRecognition({
      onInterim: (text) => {
        latestTranscriptRef.current = text;
      },
      onFinal: (text) => {
        latestTranscriptRef.current = text;
        finishRecording(text);
      },
      onError: () => {},
      onEnd: () => {},
    });
  };

  const handleStopRecording = async () => {
    let finalTrans = latestTranscriptRef.current;
    if (recognitionRef.current) {
      try {
        finalTrans = await recognitionRef.current.stop();
      } catch {}
    }
    finishRecording(finalTrans || latestTranscriptRef.current);
  };

  const finishRecording = async (transcript: string) => {
    if (!isRecording) return;
    sounds.playRecordStop();
    setIsRecording(false);

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

    const validation = validateSpeechRecording({
      transcript,
      durationMs: audioResult.durationMs,
      maxVolume: audioResult.maxVolume,
      noiseFloor: audioResult.noiseFloor,
      voiceDurationMs: audioResult.voiceDurationMs,
      recognitionSupported: recognitionRef.current?.isSupported() ?? true,
      recognitionError: recognitionRef.current?.getError(),
    });

    if (!validation.isValid) {
      setSilenceError(true);
      setHasRecordedSuccessfully(false);
      setStudentAudioBlobUrl(null);
      return;
    }

    sounds.playSuccessChime();
    setHasRecordedSuccessfully(true);
    setStudentAudioBlobUrl(audioResult.blobUrl);

    // AI model reads the completed sentence aloud
    handlePlayAISpeech();
  };

  const handlePlayAISpeech = () => {
    setIsPlayingModel(true);
    speakText(fullReflectionSentence, {
      rate: 0.85,
      onEnd: () => setIsPlayingModel(false),
    });
  };

  const handlePlayStudentAudio = () => {
    if (!studentAudioBlobUrl) return;
    if (studentAudioPlayerRef.current) {
      studentAudioPlayerRef.current.pause();
    }
    const audio = new Audio(studentAudioBlobUrl);
    studentAudioPlayerRef.current = audio;
    setIsPlayingStudent(true);
    audio.onended = () => setIsPlayingStudent(false);
    audio.play().catch(() => setIsPlayingStudent(false));
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-3 py-3 sm:px-5 overflow-y-auto">
      {/* Top Header with Cumulative Badge Count */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-bold text-slate-800 font-story">Story Completed</span>
        </div>
        {/* Cumulative badge counter in top-right corner */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm shadow-xs">
          <span>🏅</span>
          <span className="tabular-nums font-extrabold">{badgeCount} Badges</span>
        </div>
      </div>

      {/* Celebration Heading with shared MaxDog illustration */}
      <div className="text-center space-y-2 py-1">
        <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[4/3] mx-auto rounded-3xl overflow-hidden shadow-md border-2 border-amber-300">
        <StoryIllustration pageNumber="result" aspectRatio="4/3" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-story">
          You finished the story!
        </h1>
        <p className="text-sm font-bold text-amber-700 font-korean">
          축하해요! 이야기 책 한 권을 멋지게 완독했어요!
        </p>
      </div>

      {/* Summary Score Metrics */}
      <div className="grid grid-cols-3 gap-2.5 my-2.5">
        <div className="bg-white p-3 rounded-2xl border border-amber-200/80 shadow-xs text-center">
          <span className="text-xs font-semibold text-slate-500 block">Questions</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">
            {score} / {totalQuestions}
          </span>
          <span className="text-[11px] text-slate-400 block font-korean">추론 퀴즈</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-amber-200/80 shadow-xs text-center">
          <span className="text-xs font-semibold text-slate-500 block">Words Saved</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
            {savedWords.length}
          </span>
          <span className="text-[11px] text-slate-400 block font-korean">저장한 단어</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-amber-200/80 shadow-xs text-center">
          <span className="text-xs font-semibold text-slate-500 block">Sentences</span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600 tabular-nums">
            {sentencesReadCount} / {totalSentencesCount}
          </span>
          <span className="text-[11px] text-slate-400 block font-korean">소리 내어 읽은 문장</span>
        </div>
      </div>

      {/* Feeling Reflection */}
      <div className="bg-white rounded-3xl p-4 border border-amber-200 shadow-sm space-y-3.5 my-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 font-story">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Story Feeling Reflection</span>
          </div>
          <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
            CEFR A1 Can-Do
          </span>
        </div>

        {/* Step 1: Emoji Row */}
        <div>
          <span className="text-sm font-bold text-slate-700 block mb-2 font-story">
            1. How did you feel? <span className="font-korean text-xs font-normal text-slate-500">(어떤 기분이었나요?)</span>
          </span>
          <div className="grid grid-cols-4 gap-2">
            {EMOTION_OPTIONS.map((opt) => {
              const isSelected = selectedEmotion === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => handleSelectEmotion(opt.type)}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/30 shadow-xs scale-102 font-bold text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-3xl leading-none">{opt.emoji}</span>
                  <span className="text-sm font-bold capitalize font-story">
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-600 font-korean">
                    {opt.labelKr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Because Sentence Chips */}
        <div>
          <span className="text-sm font-bold text-slate-700 block mb-2 font-story">
            2. Choose "because..." <span className="font-korean text-xs font-normal text-slate-500">(이유를 골라보세요)</span>
          </span>
          <div className="space-y-2">
            {activeEmotionOption.becauseOptions.map((opt, i) => {
              const isSelected = selectedBecause === opt;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectBecause(opt)}
                  className={`w-full text-left p-3 rounded-xl border text-sm sm:text-base font-story leading-snug transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-400/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>because {opt}</span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-amber-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Completed Reflection Card */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-xs uppercase font-extrabold text-amber-800 tracking-wider block">
            Your Sentence <span className="font-korean text-xs font-bold text-amber-700 normal-case">(완성된 나의 문장)</span>
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-900 font-story leading-snug">
            "{fullReflectionSentence}"
          </p>

          {/* Silence warning if learner says nothing or speech is invalid */}
          {silenceError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between gap-2 text-rose-700 text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>I couldn't hear you. Let's try again!</span>
              </div>
              <button
                onClick={handleStartRecording}
                className="py-1.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 cursor-pointer font-korean"
              >
                Record again (다시 녹음하기)
              </button>
            </div>
          )}

          {/* Recording / Playback actions for reflection sentence */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {isRecording ? (
              <button
                onClick={handleStopRecording}
                className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all font-korean cursor-pointer"
              >
                <MicOff className="w-4 h-4 animate-bounce" />
                <span>Done Reading (읽기 완료)</span>
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all font-korean cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>
                  {hasRecordedSuccessfully ? 'Record again (다시 녹음)' : 'Read Sentence Aloud (문장 소리 내어 읽기)'}
                </span>
              </button>
            )}

            {/* Model AI speech button */}
            <button
              onClick={handlePlayAISpeech}
              className={`py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border font-korean cursor-pointer ${
                isPlayingModel
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
              title="올바른 발음 확인"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingModel ? '재생 중...' : '올바른 발음 확인'}</span>
            </button>

            {/* Student's own voice playback */}
            {hasRecordedSuccessfully && studentAudioBlobUrl && (
              <button
                onClick={handlePlayStudentAudio}
                className={`py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border cursor-pointer ${
                  isPlayingStudent
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                }`}
                title="내 녹음 듣기"
              >
                <Play className="w-4 h-4 text-emerald-600" />
                <span>{isPlayingStudent ? '재생 중...' : 'Listen to my voice'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2 pb-2">
        <button
          onClick={onOpenWordBank}
          className="w-full py-3 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm flex items-center justify-center gap-2 border border-amber-300/80 shadow-xs transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-700" />
          <span>Review Word Bank ({savedWords.length} words saved)</span>
        </button>

        {/* Story Rebuilder Button */}
        <button
          onClick={onOpenStoryRebuilder}
          className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer font-story"
        >
          <Shuffle className="w-5 h-5" />
          <span>Story Rebuilder <span className="font-korean text-xs font-bold">(이야기 다시 짓기)</span></span>
        </button>
      </div>
    </div>
  );
};
