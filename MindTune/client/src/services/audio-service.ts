interface AudioGenerationParams {
  affirmations: string;
  frequency: number;
  volume: number;
  duration: number;
  voice: string;
  preset?: string;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private generatedBlob: Blob | null = null;

  constructor() {
    // Initialize AudioContext on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume context if suspended (required by modern browsers)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
        throw new Error('Audio not supported in this browser');
      }
    }
  }

  async generateBinauralBeat(frequency: number, duration: number, volume: number): Promise<AudioBuffer> {
    try {
      this.initializeAudioContext();
      if (!this.audioContext) {
        throw new Error("AudioContext not available");
      }

      // Ensure context is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const sampleRate = this.audioContext.sampleRate;
      const length = Math.floor(sampleRate * duration);
      
      if (length <= 0) {
        throw new Error("Invalid duration - must be greater than 0");
      }
      
      // Check if the buffer size is too large (Chrome/Safari limit ~1GB)
      const maxSamples = Math.floor(128 * 1024 * 1024 / 8); // ~16M samples (about 5.5 minutes at 48kHz)
      if (length > maxSamples) {
        throw new Error(`Audio duration too long. Maximum duration is approximately ${Math.floor(maxSamples / sampleRate / 60)} minutes.`);
      }

      const buffer = this.audioContext.createBuffer(2, length, sampleRate);
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);

      // For low frequencies (binaural beats), use carrier frequency
      // For high frequencies, use direct frequency generation
      let leftFreq, rightFreq;
      
      if (frequency <= 100) {
        // Traditional binaural beats with carrier frequency
        const baseFreq = 220; // A3 note
        leftFreq = baseFreq;
        rightFreq = baseFreq + frequency;
      } else {
        // For higher frequencies, generate the frequency directly
        leftFreq = frequency;
        rightFreq = frequency;
      }

      const volumeMultiplier = Math.max(0.01, Math.min(1, volume / 100)) * 0.3;

      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const leftSample = Math.sin(2 * Math.PI * leftFreq * time) * volumeMultiplier;
        const rightSample = Math.sin(2 * Math.PI * rightFreq * time) * volumeMultiplier;
        
        leftChannel[i] = leftSample;
        rightChannel[i] = rightSample;
      }

      return buffer;
    } catch (error) {
      console.error('Error generating binaural beat:', error);
      console.error('Error details:', {
        frequency,
        duration,
        volume,
        sampleRate: this.audioContext?.sampleRate,
        calculatedLength: this.audioContext ? Math.floor(this.audioContext.sampleRate * duration) : 'N/A'
      });
      throw new Error(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async textToSpeech(text: string, voice: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported, skipping voice generation');
        resolve();
        return;
      }

      // Wait for voices to load
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
          setTimeout(loadVoices, 100);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice based on preference with better detection
        let selectedVoice = null;
        
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        if (voice === 'female') {
          // First try explicit female voices
          selectedVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes('female') || name.includes('woman') || 
                   name.includes('samantha') || name.includes('victoria') || 
                   name.includes('zira') || name.includes('karen') || 
                   name.includes('susan') || name.includes('allison') ||
                   name.includes('siri') || name.includes('kate') ||
                   name.includes('fiona') || name.includes('moira');
          });
          
          // If no explicit female, try by language (English voices often female by default)
          if (!selectedVoice) {
            selectedVoice = voices.find(v => 
              v.lang.startsWith('en') && 
              !v.name.toLowerCase().includes('male') && 
              !v.name.toLowerCase().includes('man') && 
              !v.name.toLowerCase().includes('david') && 
              !v.name.toLowerCase().includes('mark')
            );
          }
        } else if (voice === 'male') {
          // Find explicit male voices
          selectedVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes('male') || name.includes('man') || 
                   name.includes('david') || name.includes('mark') ||
                   name.includes('daniel') || name.includes('thomas') ||
                   name.includes('alex') || name.includes('tom');
          });
        }

        // Fallback to first English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
          console.log('Using fallback voice:', selectedVoice?.name);
        }
        
        console.log('Selected voice for', voice + ':', selectedVoice?.name, '(' + selectedVoice?.lang + ')');
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 0.5; // Even higher volume so you can definitely hear it

        utterance.onend = () => {
          console.log('Speech synthesis completed');
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.warn('Speech synthesis error:', event.error);
          resolve(); // Don't fail the entire process
        };

        console.log('Starting speech synthesis...');
        speechSynthesis.speak(utterance);
      };

      loadVoices();
    });
  }

  // Test function to check voice selection
  async testVoice(voice: string): Promise<void> {
    const testText = `This is a test of the ${voice} voice.`;
    return this.textToSpeech(testText, voice);
  }

  async generatePreview(params: AudioGenerationParams): Promise<Blob> {
    try {
      console.log('Generating audio preview with params:', params);
      
      // Validate parameters
      if (params.frequency < 1 || params.frequency > 10000) {
        throw new Error('Frequency must be between 1 and 10000 Hz');
      }

      this.initializeAudioContext();
      if (!this.audioContext) {
        throw new Error("AudioContext not available");
      }

      // Generate short 5-second preview
      const previewDuration = 5;
      console.log('Generating preview binaural beat for', previewDuration, 'seconds at', params.frequency, 'Hz');
      
      const binauralBuffer = await this.generateBinauralBeat(
        params.frequency,
        previewDuration,
        params.volume
      );

      console.log('Preview binaural beat generated successfully');

      // Convert buffer to blob
      const blob = await this.audioBufferToBlob(binauralBuffer);
      
      // Store the affirmations and voice for playback
      (blob as any)._affirmations = params.affirmations;
      (blob as any)._voice = params.voice;
      
      console.log('Preview audio generation completed successfully');
      return blob;

    } catch (error) {
      console.error('Preview generation error:', error);
      throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSubliminalAudio(params: AudioGenerationParams): Promise<Blob> {
    try {
      console.log('Starting audio generation with params:', params);
      
      // Validate parameters
      if (!params.affirmations || params.affirmations.trim().length === 0) {
        throw new Error('Affirmations text is required');
      }
      
      if (params.frequency < 1 || params.frequency > 10000) {
        throw new Error('Frequency must be between 1 and 10000 Hz');
      }

      this.initializeAudioContext();
      if (!this.audioContext) {
        throw new Error("AudioContext not available");
      }

      // Generate binaural beat audio buffer
      const duration = Math.min(params.duration * 60, 7200); // Limit to 2 hours max (7200 seconds)
      console.log('Generating binaural beat for', duration, 'seconds at', params.frequency, 'Hz');
      
      const binauralBuffer = await this.generateBinauralBeat(
        params.frequency,
        duration,
        params.volume
      );

      console.log('Binaural beat generated successfully');

      // Convert buffer to blob
      const blob = await this.audioBufferToBlob(binauralBuffer);
      
      // Store the affirmations and voice for playback
      (blob as any)._affirmations = params.affirmations;
      (blob as any)._voice = params.voice;
      
      this.generatedBlob = blob;
      console.log('Audio generation completed successfully');
      return blob;

    } catch (error) {
      console.error('Audio generation error:', error);
      throw new Error(`Audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async audioBufferToBlob(buffer: AudioBuffer): Promise<Blob> {
    try {
      const length = buffer.length;
      const channels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      
      console.log(`Converting audio buffer: ${length} samples, ${channels} channels, ${sampleRate} Hz`);
      
      // Create proper WAV file with header
      const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * channels * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, channels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * channels * 2, true);
      view.setUint16(32, channels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * channels * 2, true);
      
      // Audio data
      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < channels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
          view.setInt16(offset, sample * 0x7FFF, true);
          offset += 2;
        }
      }

      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      console.log('Audio buffer converted to blob successfully, size:', blob.size);
      return blob;
    } catch (error) {
      console.error('Error converting audio buffer to blob:', error);
      throw new Error('Failed to convert audio to playable format');
    }
  }

  playPreview(blob?: Blob): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if (blob || this.generatedBlob) {
      const audioBlob = blob || this.generatedBlob!;
      const url = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(url);
      
      this.currentAudio.addEventListener('loadeddata', () => {
        if (this.currentAudio) {
          this.currentAudio.play().catch(error => {
            console.error('Failed to play audio:', error);
          });
          
          // Play speech synthesis alongside the binaural beats
          const affirmations = (audioBlob as any)._affirmations;
          const voice = (audioBlob as any)._voice;
          
          if (affirmations && affirmations.trim()) {
            console.log('Playing affirmations alongside binaural beats...');
            this.textToSpeech(affirmations, voice || 'female').catch(error => {
              console.warn('Speech synthesis failed during playback:', error);
            });
          }
        }
      });
      
      this.currentAudio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
      });
    }
  }

  stopPreview(): void {
    // Stop current audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Stop speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }

  downloadAudio(): void {
    if (!this.generatedBlob) {
      throw new Error('No audio generated yet');
    }

    const url = URL.createObjectURL(this.generatedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subliminal-audio-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getCurrentTime(): number {
    return this.currentAudio?.currentTime || 0;
  }

  getDuration(): number {
    return this.currentAudio?.duration || 0;
  }

  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = volume / 100;
    }
  }
}

export const audioService = new AudioService();
