import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Sliders, Play, Pause, StopCircle, FileVolume, ChevronsUp, Download, Sparkles, Headphones, Upload, Mic, MicOff, Video, X, FileAudio, Square, Camera, Monitor, Palette, Settings, Film, Clapperboard, Loader2, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";
import { Link } from "wouter";

const createAudioSchema = (maxDuration: number) => z.object({
  affirmations: z.string().min(1, "Please enter your affirmations"),
  preset: z.string().optional(),
  customFrequency: z.number().min(1).max(10000),
  volume: z.number().min(0).max(100),
  duration: z.number().min(1).max(maxDuration),
  voice: z.enum(["female", "male"]),
  // Upload and recording options
  uploadedAudio: z.instanceof(File).optional(),
  uploadedVideo: z.instanceof(File).optional(),
  recordedAudio: z.instanceof(Blob).optional(),
  useUploadedAudio: z.boolean().default(false),
  useUploadedVideo: z.boolean().default(false),
  useRecordedAudio: z.boolean().default(false),
  generateVideoOutput: z.boolean().default(false),
  generateAudioOutput: z.boolean().default(true),
  // Video editing options
  textOverlayEnabled: z.boolean().default(false),
  textFont: z.string().default("Arial"),
  textFontSize: z.number().default(24),
  textColor: z.string().default("#FFFFFF"),
  textPosition: z.enum(["top", "center", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"]).default("center"),
  textOpacity: z.number().min(0).max(1).default(0.8),
  textAnimation: z.enum(["none", "fade", "slide", "typewriter"]).default("fade"),
  showAffirmationsAsText: z.boolean().default(false),
  // Video creation options
  createVideoFromScratch: z.boolean().default(false),
  videoCreationType: z.enum(["canvas", "camera", "screen"]).default("canvas"),
  canvasBackground: z.string().default("#000000"),
  videoDuration: z.number().min(10).max(7200).default(60), // 2 hours for Premium users
  recordedVideo: z.instanceof(Blob).optional(),
});

type AudioFormData = z.infer<ReturnType<typeof createAudioSchema>>;

const PRESETS = [
  { value: "delta", label: "Delta Waves (1-4 Hz) - Deep Sleep", frequency: 2 },
  { value: "theta", label: "Theta Waves (4-8 Hz) - Deep Meditation", frequency: 6 },
  { value: "alpha", label: "Alpha Waves (8-13 Hz) - Relaxed Focus", frequency: 10 },
  { value: "beta", label: "Beta Waves (14-30 Hz) - Active Thinking", frequency: 20 },
  { value: "gamma", label: "Gamma Waves (30-100 Hz) - High Focus", frequency: 40 },
  { value: "high_gamma", label: "High Gamma (100-200 Hz) - Peak Performance", frequency: 150 },
  { value: "ultra_high", label: "Ultra High (200-1000 Hz) - Advanced", frequency: 500 },
  { value: "sonic", label: "Sonic Range (1-10 kHz) - Experimental", frequency: 5000 },
];

const SAMPLE_AFFIRMATIONS = [
  "I am confident and successful",
  "I attract abundance into my life", 
  "I am worthy of love and happiness",
  "I believe in my unlimited potential",
  "I am grateful for all the good in my life"
];

export default function AudioGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [membershipInfo, setMembershipInfo] = useState<{
    membershipTier: string;
    downloadsUsed: number;
    canDownload: boolean;
    reason?: string;
  } | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  // Preview audio management
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  
  // Video creation and recording states
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [canvasRecorder, setCanvasRecorder] = useState<MediaRecorder | null>(null);
  const [generatedVideoBlob, setGeneratedVideoBlob] = useState<Blob | null>(null);
  
  const { toast } = useToast();
  
  const {
    isPlaying,
    currentTime,
    duration: audioDuration,
    generatedAudio,
    playPreview,
    stopPreview,
    generateAudio,
    generatePreview,
    downloadAudio,
    setPreviewVolume
  } = useAudio();

  // Get maximum duration based on membership tier
  const getMaxDuration = () => {
    if (!membershipInfo) return 1; // Default to free tier if no membership info
    
    switch (membershipInfo.membershipTier) {
      case 'premium':
        return 120; // 2 hours
      case 'basic':
        return 30; // 30 minutes
      case 'free':
      default:
        return 1; // 1 minute
    }
  };

  // Helper functions to check user access
  const isFreeTier = () => !membershipInfo || membershipInfo.membershipTier === 'free';
  const isBasicTier = () => membershipInfo?.membershipTier === 'basic';
  const isPremiumTier = () => membershipInfo?.membershipTier === 'premium';
  const hasBasicAccess = () => isBasicTier() || isPremiumTier();
  const hasPremiumAccess = () => isPremiumTier();

  const maxDuration = getMaxDuration();
  const audioSchema = createAudioSchema(maxDuration);
  
  const form = useForm<AudioFormData>({
    resolver: zodResolver(audioSchema),
    defaultValues: {
      affirmations: "",
      preset: "",
      customFrequency: 40,
      volume: 70,
      duration: Math.min(1, maxDuration), // Default to 1 minute or max allowed
      voice: "female",
      uploadedAudio: undefined,
      uploadedVideo: undefined,
      recordedAudio: undefined,
      useUploadedAudio: false,
      useUploadedVideo: false,
      useRecordedAudio: false,
      generateVideoOutput: false,
      generateAudioOutput: true,
      textOverlayEnabled: false,
      textFont: "Arial",
      textFontSize: 24,
      textColor: "#FFFFFF",
      textPosition: "center",
      textOpacity: 0.8,
      textAnimation: "fade",
      showAffirmationsAsText: false,
      createVideoFromScratch: false,
      videoCreationType: "canvas",
      canvasBackground: "#000000",
      videoDuration: Math.min(60, maxDuration * 60), // Default to 1 minute or max allowed
      recordedVideo: undefined,
    },
  });

  const watchedAffirmations = form.watch("affirmations");
  const watchedFrequency = form.watch("customFrequency");

  useEffect(() => {
    setCharacterCount(watchedAffirmations.length);
  }, [watchedAffirmations]);

  // Fetch membership info on component mount (using a mock user ID for now)
  useEffect(() => {
    const fetchMembershipInfo = async () => {
      try {
        const response = await fetch('/api/user/1/membership');
        if (response.ok) {
          const data = await response.json();
          setMembershipInfo(data);
        } else {
          // Set default free tier info if user doesn't exist
          setMembershipInfo({
            membershipTier: 'free',
            downloadsUsed: 0,
            canDownload: false,
            reason: 'Upgrade to Basic or Premium to download audio files'
          });
        }
      } catch (error) {
        console.error('Failed to fetch membership info:', error);
        // Set default free tier info on error
        setMembershipInfo({
          membershipTier: 'free',
          downloadsUsed: 0,
          canDownload: false,
          reason: 'Upgrade to Basic or Premium to download audio files'
        });
      }
    };
    
    fetchMembershipInfo();
  }, []);

  const handlePresetChange = (preset: string) => {
    const presetData = PRESETS.find(p => p.value === preset);
    if (presetData) {
      form.setValue("customFrequency", presetData.frequency);
    }
  };

  const loadSampleAffirmations = () => {
    form.setValue("affirmations", SAMPLE_AFFIRMATIONS.join(". "));
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedBlob(blob);
        form.setValue('recordedAudio', blob);
        form.setValue('useRecordedAudio', true);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Recording Complete",
          description: "Audio recorded successfully.",
        });
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your affirmations now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const clearRecording = () => {
    setRecordedBlob(null);
    form.setValue('recordedAudio', undefined);
    form.setValue('useRecordedAudio', false);
  };

  // Video creation functions
  const startVideoRecording = async (type: 'camera' | 'screen') => {
    try {
      let stream: MediaStream;
      
      if (type === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { width: 1280, height: 720 },
          audio: true 
        });
      }
      
      setVideoStream(stream);
      
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideoBlob(blob);
        form.setValue('recordedVideo', blob);
        stream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      };
      
      recorder.start();
      setVideoRecorder(recorder);
      setIsVideoRecording(true);
      
      toast({
        title: `${type === 'camera' ? 'Camera' : 'Screen'} recording started`,
        description: "Click stop when you're finished recording",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : 'Unable to access video',
        variant: "destructive",
      });
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder && isVideoRecording) {
      videoRecorder.stop();
      setIsVideoRecording(false);
      setVideoRecorder(null);
    }
  };

  const createCanvasVideo = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      
      // Set background
      ctx.fillStyle = form.watch('canvasBackground');
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text if enabled
      if (form.watch('showAffirmationsAsText') && form.watch('affirmations')) {
        ctx.font = `${form.watch('textFontSize')}px ${form.watch('textFont')}`;
        ctx.fillStyle = form.watch('textColor');
        ctx.globalAlpha = form.watch('textOpacity');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = form.watch('affirmations').split('\n');
        const lineHeight = form.watch('textFontSize') * 1.2;
        const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });
      }
      
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setGeneratedVideoBlob(blob);
        form.setValue('recordedVideo', blob);
      };
      
      recorder.start();
      setCanvasRecorder(recorder);
      
      // Record for specified duration
      setTimeout(() => {
        recorder.stop();
        setCanvasRecorder(null);
        toast({
          title: "Canvas video created",
          description: "Your custom video has been generated",
        });
      }, form.watch('videoDuration') * 1000);
      
      toast({
        title: "Creating canvas video",
        description: `Generating ${form.watch('videoDuration')} second video...`,
      });
    } catch (error) {
      toast({
        title: "Canvas video creation failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const clearVideoRecording = () => {
    setRecordedVideoBlob(null);
    form.setValue('recordedVideo', undefined);
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const handlePlayPreview = async () => {
    // If we have generated audio, play it; otherwise generate a preview
    if (generatedAudio) {
      playPreview();
    } else {
      const formData = form.getValues();
      
      try {
        const previewBlob = await generatePreview({
          affirmations: formData.affirmations || "Preview test",
          frequency: formData.customFrequency,
          volume: formData.volume,
          duration: 1, // Short preview
          voice: formData.voice,
          preset: formData.preset
        });
        
        // Play the preview blob directly using audioService
        const { audioService } = await import("@/services/audio-service");
        audioService.playPreview(previewBlob);
        
        toast({
          title: "Preview Playing",
          description: "Playing audio preview with affirmations.",
        });
      } catch (error) {
        console.error('Preview generation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        toast({
          title: "Preview Failed",
          description: `Preview error: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handlePreview = async () => {
    const formData = form.getValues();
    
    try {
      const previewBlob = await generatePreview({
        affirmations: formData.affirmations || "Preview test",
        frequency: formData.customFrequency,
        volume: formData.volume,
        duration: 1, // Short preview
        voice: formData.voice,
        preset: formData.preset
      });
      
      // Play the preview blob directly
      const audioUrl = URL.createObjectURL(previewBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      toast({
        title: "Preview Generated",
        description: "5-second binaural beat preview is now playing.",
      });
    } catch (error) {
      console.error('Preview generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Preview Failed",
        description: `Preview error: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const testVoice = async () => {
    const formData = form.getValues();
    const { audioService } = await import("@/services/audio-service");
    
    try {
      await audioService.testVoice(formData.voice);
      toast({
        title: "Voice Test",
        description: `Testing ${formData.voice} voice - you should hear it speak now.`,
      });
    } catch (error) {
      console.error('Voice test failed:', error);
      toast({
        title: "Voice Test Failed",
        description: "Could not test voice. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!membershipInfo?.canDownload) {
      toast({
        title: "Download Not Available",
        description: membershipInfo?.reason || "You cannot download audio files with your current membership.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Record the download in the backend
      const response = await fetch('/api/user/1/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioSessionId: 1 // This would be the actual session ID
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.reason || 'Download failed');
      }

      // Use the existing download audio functionality
      downloadAudio();
      
      // Refresh membership info to update download count
      const membershipResponse = await fetch('/api/user/1/membership');
      if (membershipResponse.ok) {
        const data = await membershipResponse.json();
        setMembershipInfo(data);
      }

      toast({
        title: "Download Started",
        description: "Your audio file is downloading...",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const handleVideoDownload = async () => {
    if (!membershipInfo?.canDownload) {
      toast({
        title: "Download Not Available",
        description: membershipInfo?.reason || "You cannot download video files with your current membership.",
        variant: "destructive",
      });
      return;
    }

    const videoToDownload = generatedVideoBlob || recordedVideoBlob;
    if (!videoToDownload) {
      toast({
        title: "No Video Available",
        description: "Please create a video first before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Record the download in the backend
      const response = await fetch('/api/user/1/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioSessionId: 1 // This would be the actual session ID
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.reason || 'Download failed');
      }

      // Download the video
      const url = URL.createObjectURL(videoToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subliminal-video-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Refresh membership info to update download count
      const membershipResponse = await fetch('/api/user/1/membership');
      if (membershipResponse.ok) {
        const data = await membershipResponse.json();
        setMembershipInfo(data);
      }

      toast({
        title: "Download Started",
        description: "Your video file is downloading...",
      });
    } catch (error) {
      console.error('Video download failed:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  // Preview audio management functions
  const stopPreviewAudio = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
  };

  const playPreviewFile = (file: File | Blob) => {
    stopPreviewAudio(); // Stop any currently playing preview
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.play();
    setPreviewAudio(audio);
    
    // Auto cleanup when audio ends
    audio.onended = () => {
      setPreviewAudio(null);
      URL.revokeObjectURL(url);
    };
  };

  const handleGenerateAudio = async (data: AudioFormData) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await generateAudio({
        affirmations: data.affirmations,
        frequency: data.customFrequency,
        volume: data.volume,
        duration: data.duration,
        voice: data.voice,
        preset: data.preset
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      toast({
        title: "Audio Generated Successfully",
        description: "Your subliminal audio is ready to download.",
      });
    } catch (error) {
      console.error('Audio generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Generation Failed",
        description: `Audio generation error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerateAudio)} className="space-y-6">
          {/* Affirmations Input */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Edit className="text-indigo-400 w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-white">Custom Affirmations</h2>
              </div>
              
              <FormField
                control={form.control}
                name="affirmations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        {...field}
                        className="w-full h-32 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                        placeholder="Enter your positive affirmations here... (e.g., 'I am confident and successful', 'I attract abundance', 'I am worthy of love')"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-400">
                  Characters: <span>{characterCount}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadSampleAffirmations}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Load Examples
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <Sliders className="text-violet-400 w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-white">Audio Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preset Selection */}
                <FormField
                  control={form.control}
                  name="preset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Binaural Beat Presets</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handlePresetChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                            <SelectValue placeholder="Select a preset..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {PRESETS.map(preset => (
                            <SelectItem key={preset.value} value={preset.value} className="text-gray-100">
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Custom Frequency */}
                <FormField
                  control={form.control}
                  name="customFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Custom Frequency (Hz)</FormLabel>
                      <div className="flex space-x-3">
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10000"
                            step="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="bg-gray-700 border-gray-600 text-gray-100"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-violet-500/20 text-violet-400 border-violet-500/20 hover:bg-violet-500/30"
                        >
                          Apply
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Audio Upload Section - Basic/Premium */}
              {hasBasicAccess() ? (
                <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <h3 className="text-emerald-400 font-medium mb-3 flex items-center">
                    <FileAudio className="w-4 h-4 mr-2" />
                    Upload Your Audio
                  </h3>
                  <FormField
                    control={form.control}
                    name="uploadedAudio"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            <Input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  field.onChange(file);
                                  form.setValue('useUploadedAudio', true);
                                }
                              }}
                              className="bg-gray-700 border-gray-600 text-gray-100 file:bg-emerald-500/20 file:text-emerald-400 file:border-0 file:rounded file:px-3 file:py-1"
                            />
                            {field.value && (
                              <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                                <span className="text-sm text-gray-300">{field.value.name}</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => field.value && playPreviewFile(field.value)}
                                    className="text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
                                  {previewAudio && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={stopPreviewAudio}
                                      className="text-red-400 hover:text-red-300 border-red-500/30"
                                    >
                                      <StopCircle className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      field.onChange(undefined);
                                      form.setValue('useUploadedAudio', false);
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <h3 className="text-gray-400 font-medium mb-3 flex items-center">
                    <FileAudio className="w-4 h-4 mr-2" />
                    Upload Your Audio
                  </h3>
                  <p className="text-sm text-gray-400">
                    Basic or Premium membership required to upload audio files.
                  </p>
                  <Link href="/membership">
                    <Button size="sm" className="mt-3 bg-blue-500 hover:bg-blue-600 text-white">
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              )}

              {/* Video Upload Section - Premium Only */}
