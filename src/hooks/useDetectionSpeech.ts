import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

export function useDetectionSpeech(cooldownMs: number = 3000) {
  const lastSpokenTimestamp = useRef<number>(0);

  return useCallback(
    (text: string) => {
      const now = Date.now();
      if (now - lastSpokenTimestamp.current < cooldownMs) return;

      Speech.speak(text);
      lastSpokenTimestamp.current = now;
    },
    [cooldownMs]
  );
}