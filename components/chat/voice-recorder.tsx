import React, { useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, isUploading, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voicenote-${Date.now()}.webm`, { type: 'audio/webm' });
        onRecordingComplete(file);
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Failed to access microphone. Please ensure you have granted permission.");
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`size-7 rounded-xl transition-all duration-200 ${
        isRecording 
          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 active:scale-95' 
          : 'text-muted-foreground/80 hover:bg-muted hover:text-foreground active:scale-95'
      }`}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isUploading}
      title={isRecording ? "Stop Recording" : "Record Voice Note"}
    >
      {isRecording ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
          <rect width="18" height="18" x="3" y="3" rx="2" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      )}
    </Button>
  );
}
