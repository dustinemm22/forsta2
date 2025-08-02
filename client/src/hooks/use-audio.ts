import { useState, useEffect, useCallback } from "react";
import { audioService } from "@/services/audio-service";

interface AudioGenerationParams {
  affirmations: string;
  frequency: number;
  volume: number;
  duration: number;
  voice: string;
  preset?: string;
}

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioService.isPlaying()) {
        setCurrentTime(audioService.getCurrentTime());
        setDuration(audioService.getDuration());
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const generateAudio = useCallback(async (params: AudioGenerationParams) => {
    try {
      const audioBlob = await audioService.generateSubliminalAudio(params);
      setGeneratedAudio(audioBlob);
      return audioBlob;
    } catch (error) {
      console.error('Failed to generate audio:', error);
      throw error;
    }
  }, []);

  const generatePreview = useCallback(async (params: AudioGenerationParams) => {
    try {
      const previewBlob = await audioService.generatePreview(params);
      return previewBlob;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      throw error;
    }
  }, []);

  const playPreview = useCallback(() => {
    try {
      audioService.playPreview(generatedAudio || undefined);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play preview:', error);
    }
  }, [generatedAudio]);

  const stopPreview = useCallback(() => {
    audioService.stopPreview();
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const downloadAudio = useCallback(() => {
    try {
      audioService.downloadAudio();
    } catch (error) {
      console.error('Failed to download audio:', error);
      throw error;
    }
  }, []);

  const setPreviewVolume = useCallback((volume: number) => {
    audioService.setVolume(volume);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    generatedAudio,
    generateAudio,
    generatePreview,
    playPreview,
    stopPreview,
    downloadAudio,
    setPreviewVolume,
  };
}
