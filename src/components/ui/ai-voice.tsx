"use client";

/**
 * @author: @kokonutui
 * @description: AI Voice
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { Mic, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceProps {
  onRecordingComplete?: (duration: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onTextConverted?: (text: string) => void;
}

export default function AIVoice({ 
  onRecordingComplete, 
  onRecordingStart, 
  onRecordingStop,
  onTextConverted
}: AIVoiceProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [maxTimeout, setMaxTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const transcriptRef = useRef("");

  useEffect(() => {
    setIsClient(true);
    
    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      setIsBrowserSupported(true);
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        onRecordingStart?.();
        setSubmitted(true);
        setTranscript("");
        setTime(0);
        setErrorMessage("");
        
        const initialTimeout = setTimeout(() => {
          if (recognitionInstance && submitted) {
            console.log('Initial silence timeout, stopping recognition');
            recognitionInstance.stop();
          }
        }, 3000);
        setSilenceTimeout(initialTimeout);
        
        const maxTimeoutId = setTimeout(() => {
          console.log('Max timeout reached, stopping recognition');
          if (recognitionInstance && submitted) {
            recognitionInstance.stop();
          }
        }, 10000);
        setMaxTimeout(maxTimeoutId);
      };
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript;
        
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
        
        const newTimeout = setTimeout(() => {
          if (recognitionInstance && submitted) {
            console.log('Silence detected, stopping recognition');
            recognitionInstance.stop();
          }
        }, 2000);
        
        setSilenceTimeout(newTimeout);
      };
      
      recognitionInstance.onend = () => {
        console.log('Recognition ended, transcript:', transcriptRef.current);
        setIsListening(false);
        setSubmitted(false);
        onRecordingStop?.();
        
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          setSilenceTimeout(null);
        }
        if (maxTimeout) {
          clearTimeout(maxTimeout);
          setMaxTimeout(null);
        }
        
        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript) {
          console.log('Sending transcript:', finalTranscript);
          onTextConverted?.(finalTranscript);
        }
        
        setTranscript("");
        transcriptRef.current = "";
        setTime(0);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('🎤 Voice Recognition Error:', event.error);
        setIsListening(false);
        setSubmitted(false);
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          setSilenceTimeout(null);
        }
        if (maxTimeout) {
          clearTimeout(maxTimeout);
          setMaxTimeout(null);
        }
        setTranscript("");
        transcriptRef.current = "";
        setTime(0);
        
        let userFriendlyMessage = '';
        switch (event.error) {
          case 'not-allowed':
            userFriendlyMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings.';
            break;
          case 'no-speech':
            userFriendlyMessage = 'No speech detected. Please try again and speak clearly.';
            break;
          case 'audio-capture':
            userFriendlyMessage = 'Microphone not found. Please check your microphone connection.';
            break;
          case 'network':
            userFriendlyMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            userFriendlyMessage = 'Voice recognition error. Please try again.';
        }
        
        console.log('🎤 USER MESSAGE:', userFriendlyMessage);
        setErrorMessage(userFriendlyMessage);
        
        setTimeout(() => {
          setErrorMessage("");
        }, 5000);
      };
      
      setRecognition(recognitionInstance);
    } else {
      setIsBrowserSupported(false);
      setErrorMessage('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      console.log('🎤 USER MESSAGE: Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  }, [onRecordingStart, onRecordingStop, onTextConverted, transcript]);

  useEffect(() => {
    return () => {
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      if (maxTimeout) {
        clearTimeout(maxTimeout);
      }
    };
  }, [silenceTimeout, maxTimeout]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (submitted) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      if (time > 0 && onRecordingComplete) {
        onRecordingComplete(time);
      }
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [submitted, time, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (!isBrowserSupported) {
      return;
    }
    
    if (!submitted && recognition) {
      setSubmitted(true);
      setTranscript("");
      setErrorMessage("");
      
      try {
        recognition.start();
      } catch (error) {
        console.error('🎤 Error starting recognition:', error);
        const errorMsg = 'Please allow microphone access to use voice input';
        console.log('🎤 USER MESSAGE:', errorMsg);
        setErrorMessage(errorMsg);
        setSubmitted(false);
        
        setTimeout(() => {
          setErrorMessage("");
        }, 5000);
      }
    } else if (submitted && recognition) {
      setSubmitted(false);
      recognition.stop();
    }
  };

  const getInstructionText = () => {
    if (!isBrowserSupported) {
      return "Voice input not available";
    }
    
    if (errorMessage) {
      return errorMessage;
    }
    
    if (submitted) {
      if (transcript) {
        return transcript;
      }
      return "Speak now... (stops automatically when you pause)";
    }
    
    return "Click the microphone and start speaking";
  };

  return (
    <div className="w-full py-4">
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
            !isBrowserSupported
              ? "bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-50"
              : submitted
              ? "bg-none"
              : "bg-none hover:bg-black/5 dark:hover:bg-white/5"
          )}
          type="button"
          onClick={handleClick}
          disabled={!isBrowserSupported}
          data-testid="button-voice-record"
          title={!isBrowserSupported ? "Voice input not supported in this browser" : ""}
        >
          {submitted ? (
            <div
              className="w-6 h-6 rounded-sm animate-spin bg-black dark:bg-white cursor-pointer pointer-events-auto"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className={cn(
              "w-6 h-6",
              !isBrowserSupported 
                ? "text-gray-400 dark:text-gray-600"
                : "text-black/90 dark:text-white/90"
            )} />
          )}
        </button>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            submitted
              ? "text-black/70 dark:text-white/70"
              : "text-black/30 dark:text-white/30"
          )}
        >
          {formatTime(time)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(48)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                submitted
                  ? "bg-black/50 dark:bg-white/50 animate-pulse"
                  : "bg-black/10 dark:bg-white/10 h-1"
              )}
              style={
                submitted && isClient
                  ? {
                        height: `${20 + Math.random() * 80}%`,
                        animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {errorMessage ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300 text-left">
              {errorMessage}
            </p>
          </div>
        ) : (
          <p className={cn(
            "min-h-4 text-xs text-center px-4 max-w-md",
            submitted 
              ? "text-black/70 dark:text-white/70 font-medium" 
              : !isBrowserSupported
              ? "text-red-600 dark:text-red-400"
              : "text-black/70 dark:text-white/70"
          )}>
            {getInstructionText()}
          </p>
        )}
        
        {submitted && (
          <button
            onClick={() => {
              if (recognition) {
                recognition.stop();
              }
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Stop & Send
          </button>
        )}
      </div>
    </div>
  );
}
