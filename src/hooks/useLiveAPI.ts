import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioStreamer } from '../lib/audio-streamer';
import { SetupOptions, generateSystemInstruction } from '../lib/gemini-prompts';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  
  const streamerRef = useRef<AudioStreamer | null>(null);
  const sessionPromiseRef = useRef<any>(null);

  const connect = useCallback((options: SetupOptions) => {
    if (isConnected) return;
    
    // Clear previous transcript
    setTranscript([]);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    streamerRef.current = new AudioStreamer();

    const currentTextRef = useRef('');

    const sessionPromise = ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'
        },
        systemInstruction: generateSystemInstruction(options),
      },
      callbacks: {
        onopen: () => {
          setIsConnected(true);
          // Start microphone and stream to WS
          streamerRef.current?.startRecording((base64Data) => {
            sessionPromiseRef.current?.then((session: any) => {
               session.sendRealtimeInput({
                 audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
               });
            });
          });
        },
        onmessage: async (message: LiveServerMessage) => {
          // Play audio
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            setIsSpeaking(true);
            streamerRef.current?.playPCM(base64Audio, 24000);
          }

          // Handle interruption
          if (message.serverContent?.interrupted) {
            streamerRef.current?.stopPlayback();
            setIsSpeaking(false);
          }

          // Clear speaking state when model finishes turning... we can approximate this
          if (message.serverContent?.turnComplete) {
            // Need a tiny delay since playback might still be draining
            setTimeout(() => setIsSpeaking(false), 1000);
          }
        },
        onclose: () => {
          setIsConnected(false);
          setIsSpeaking(false);
          streamerRef.current?.stopRecording();
          streamerRef.current = null;
        },
        onerror: (err: any) => {
          console.error("Live API Error", err);
        }
      }
    });

    sessionPromiseRef.current = sessionPromise;
  }, [isConnected]);

  const disconnect = useCallback(() => {
    sessionPromiseRef.current?.then((session: any) => {
      try { session.close(); } catch {}
    });
    sessionPromiseRef.current = null;
    streamerRef.current?.stopRecording();
    streamerRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  return {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    transcript
  };
}
