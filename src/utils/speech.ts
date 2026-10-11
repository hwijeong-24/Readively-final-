import { ReadingFeedback } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  }
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = options?.rate ?? 0.85; // Clear speed for Grade 5-6 elementary learners
  utterance.pitch = options?.pitch ?? 1.05;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Daniel'))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onBoundary) {
    utterance.onboundary = (e) => {
      options.onBoundary?.(e.charIndex);
    };
  }
  utterance.onerror = () => {
    options?.onEnd?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export interface AudioRecordingResult {
  blob: Blob | null;
  blobUrl: string | null;
  maxVolume: number;
  averageVolume: number;
  noiseFloor: number;
  voiceDurationMs: number;
  durationMs: number;
  hasSound: boolean;
}

export interface AudioRecorderController {
  stop: () => Promise<AudioRecordingResult>;
  getCurrentVolume: () => number;
}

/**
 * Starts audio recording with real-time volume detection (AnalyserNode)
 * Calibrates noise floor from the first ~300 ms, and tracks voice activity.
 */
export async function startAudioWithVolumeDetection(): Promise<AudioRecorderController> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('media_devices_unsupported');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let volumeCheckInterval: number | null = null;

  const startTime = Date.now();
  let maxVolume = 0;
  let currentVolume = 0;
  let totalVolumeSum = 0;
  let sampleCount = 0;

  // Calibration variables
  const noiseFloorSamples: number[] = [];
  let calibratedNoiseFloor = 0.01;
  let voiceDurationMs = 0;
  const SAMPLE_INTERVAL_MS = 25;

  try {
    audioCtx = new AudioCtx();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3;
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    volumeCheckInterval = window.setInterval(() => {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength / 255; // 0.0 to 1.0
      currentVolume = avg;
      totalVolumeSum += avg;
      sampleCount++;

      if (avg > maxVolume) {
        maxVolume = avg;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed <= 300) {
        // Collect baseline noise floor during first 300 ms
        noiseFloorSamples.push(avg);
      } else {
        if (noiseFloorSamples.length > 0 && calibratedNoiseFloor === 0.01) {
          const sumNoise = noiseFloorSamples.reduce((a, b) => a + b, 0);
          calibratedNoiseFloor = Math.max(0.008, sumNoise / noiseFloorSamples.length);
        }

        // Voice criteria: volume must clearly rise above noise floor (at least 3x noise floor, min 0.038)
        const voiceThreshold = Math.max(0.038, calibratedNoiseFloor * 3.0);
        if (avg >= voiceThreshold) {
          voiceDurationMs += SAMPLE_INTERVAL_MS;
        }
      }
    }, SAMPLE_INTERVAL_MS);
  } catch (e) {
    console.warn('AudioContext volume analysis initialization failed:', e);
  }

  let mediaRecorder: MediaRecorder | null = null;
  const audioChunks: Blob[] = [];

  try {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    mediaRecorder.start(100);
  } catch (e) {
    console.warn('MediaRecorder error:', e);
  }

  return {
    getCurrentVolume: () => currentVolume,
    stop: () =>
      new Promise<AudioRecordingResult>((resolve) => {
        if (volumeCheckInterval !== null) {
          clearInterval(volumeCheckInterval);
        }
        const durationMs = Date.now() - startTime;
        const avgVol = sampleCount > 0 ? totalVolumeSum / sampleCount : 0;

        const cleanupStream = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (source) {
            try { source.disconnect(); } catch {}
          }
          if (audioCtx && audioCtx.state !== 'closed') {
            try { audioCtx.close(); } catch {}
          }
        };

        const finish = () => {
          cleanupStream();
          let blob: Blob | null = null;
          let blobUrl: string | null = null;
          if (audioChunks.length > 0) {
            blob = new Blob(audioChunks, { type: 'audio/webm' });
            blobUrl = URL.createObjectURL(blob);
          }

          const hasSound = durationMs >= 1000 && voiceDurationMs >= 400 && maxVolume >= 0.038;

          resolve({
            blob,
            blobUrl,
            maxVolume,
            averageVolume: avgVol,
            noiseFloor: calibratedNoiseFloor,
            voiceDurationMs,
            durationMs,
            hasSound,
          });
        };

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.onstop = finish;
          try {
            mediaRecorder.stop();
          } catch {
            finish();
          }
        } else {
          finish();
        }
      }),
  };
}

export interface SpeechRecognitionController {
  stop: () => Promise<string>;
  getTranscript: () => string;
  getError: () => string | null;
  isSupported: () => boolean;
}

export function startSpeechRecognition(callbacks: {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): SpeechRecognitionController {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError('not_supported');
    callbacks.onEnd();
    return {
      stop: async () => '',
      getTranscript: () => '',
      getError: () => 'not_supported',
      isSupported: () => false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';
  let lastError: string | null = null;
  let hasEnded = false;
  let endResolve: ((value: string) => void) | null = null;

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + transcript;
      } else {
        interim += transcript;
      }
    }
    callbacks.onInterim(interim || finalTranscript);
  };

  recognition.onerror = (event: any) => {
    const err = event.error || 'recognition_failed';
    lastError = err;
    callbacks.onError(err);
  };

  recognition.onend = () => {
    hasEnded = true;
    callbacks.onFinal(finalTranscript);
    callbacks.onEnd();
    if (endResolve) {
      endResolve(finalTranscript);
      endResolve = null;
    }
  };

  try {
    recognition.start();
  } catch (err) {
    lastError = 'start_failed';
    callbacks.onError('start_failed');
    callbacks.onEnd();
  }

  return {
    getTranscript: () => finalTranscript,
    getError: () => lastError,
    isSupported: () => true,
    stop: () =>
      new Promise<string>((resolve) => {
        if (hasEnded) {
          return resolve(finalTranscript);
        }
        endResolve = resolve;
        try {
          recognition.stop();
        } catch {
          resolve(finalTranscript);
        }
        // Safety timeout of 2.8 seconds after stopping
        setTimeout(() => {
          if (endResolve) {
            endResolve(finalTranscript);
            endResolve = null;
          }
        }, 2800);
      }),
  };
}

export interface SpeechValidationParams {
  transcript: string;
  durationMs: number;
  maxVolume: number;
  noiseFloor: number;
  voiceDurationMs: number;
  recognitionSupported: boolean;
  recognitionError?: string | null;
}

export interface SpeechValidationResult {
  isValid: boolean;
  reason: string;
}

/**
 * Shared validation function for all recordings (story sentences & reflection sentence).
 * A recording is valid ONLY if BOTH conditions are true:
 * 1. Real transcript: Web Speech API returned at least 1 recognized word. Empty/whitespace = INVALID.
 * 2. Real voice volume: Calibrated noise floor, volume >= 3x noise floor for at least 400ms.
 * Shorter than 1 second, errors, or no result = INVALID.
 */
export function validateSpeechRecording(params: SpeechValidationParams): SpeechValidationResult {
  const {
    transcript,
    durationMs,
    maxVolume,
    noiseFloor,
    voiceDurationMs,
    recognitionSupported,
    recognitionError,
  } = params;

  const cleanTranscript = (transcript || '').trim();
  const words = cleanTranscript.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  let isValid = true;
  let reason = 'Valid speech detected';

  if (durationMs < 1000) {
    isValid = false;
    reason = `Recording shorter than 1 second (${durationMs}ms)`;
  } else if (recognitionError === 'no-speech' || recognitionError === 'audio-capture') {
    isValid = false;
    reason = `Speech recognition error: ${recognitionError}`;
  } else if (voiceDurationMs < 400 || maxVolume < 0.038) {
    isValid = false;
    reason = `Voice volume below threshold or duration < 400ms (voice: ${voiceDurationMs}ms, noiseFloor: ${noiseFloor.toFixed(4)}, maxVolume: ${maxVolume.toFixed(4)})`;
  } else if (recognitionSupported && words.length < 1) {
    isValid = false;
    reason = 'No recognized words from speech recognition';
  }

  // Debug logging as required
  console.log('[SpeechValidation]', {
    transcript: cleanTranscript,
    wordsCount: words.length,
    durationMs,
    noiseFloor: Number(noiseFloor.toFixed(4)),
    maxVolume: Number(maxVolume.toFixed(4)),
    voiceDurationMs,
    recognitionSupported,
    recognitionError: recognitionError || null,
    decision: isValid ? 'VALID' : 'INVALID',
    reason,
  });

  return { isValid, reason };
}

/**
 * Evaluates student transcript against the target sentence
 */
export async function evaluateReading(
  targetSentence: string,
  studentTranscript: string,
  keyWords: string[],
  audioBlobUrl?: string
): Promise<ReadingFeedback> {
  const targetTokens = new Set(targetSentence.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
  const validKeyWords = keyWords.filter(w => targetTokens.has(w.toLowerCase().trim()));

  try {
    const res = await fetch('/api/evaluate-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetSentence,
        studentTranscript,
        keyWords: validKeyWords,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawWords: string[] = Array.isArray(data.practiceWords) ? data.practiceWords : validKeyWords;
      const sanitized = rawWords.filter(w => targetTokens.has(w.toLowerCase().trim()));
      const finalPracticeWords = sanitized.length > 0
        ? sanitized.slice(0, 2)
        : validKeyWords.length > 0
          ? validKeyWords.slice(0, 2)
          : Array.from(targetTokens).filter(w => !['a', 'an', 'the', 'is', 'in', 'on', 'at', 'to', 'he', 'she', 'it'].includes(w)).slice(0, 2);

      return {
        practiceWords: finalPracticeWords,
        feedbackMessage: data.feedbackMessage,
        koreanTip: data.koreanTip,
        rating: data.rating || 5,
        allWordsMatched: data.allWordsMatched ?? true,
        studentTranscript,
        audioBlobUrl,
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    console.warn('Backend evaluation failed, using local heuristic:', err);
  }

  // Client-side heuristic comparison
  const cleanTarget = Array.from(targetTokens);
  const cleanSpoken = (studentTranscript || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const matched = cleanTarget.filter(w => cleanSpoken.includes(w));
  const missed = cleanTarget.filter(w => !cleanSpoken.includes(w) && !['a', 'an', 'the', 'is', 'in', 'on', 'at', 'to', 'he', 'she', 'it'].includes(w));
  const practiceWords = (validKeyWords.length > 0 ? validKeyWords : missed.length > 0 ? missed : cleanTarget).filter(w => targetTokens.has(w.toLowerCase().trim())).slice(0, 2);
  const matchRatio = cleanTarget.length > 0 ? matched.length / cleanTarget.length : 1;
  const rating = matchRatio >= 0.7 ? 5 : matchRatio >= 0.4 ? 4 : 3;

  return {
    practiceWords,
    feedbackMessage: rating === 5
      ? `Super reading! Practice pronouncing "${practiceWords.join('" and "')}" clearly!`
      : `Good effort! Let's practice saying "${practiceWords.join('" and "')}" with the model voice!`,
    koreanTip: `"${practiceWords.join(', ')}" 발음에 유의하며 큰 소리로 따라 해보세요!`,
    rating,
    allWordsMatched: matchRatio >= 0.7,
    studentTranscript,
    audioBlobUrl,
    timestamp: Date.now(),
  };
}
