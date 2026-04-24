export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {}

  async startRecording(onAudio: (base64: string) => void) {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } 
    });

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // We use ScriptProcessorNode as a simple cross-browser way to capture PCM
    // 4096 buffer size gives chunks every ~256ms at 16kHz
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }
      
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      // Optimization to prevent max call stack
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
      }
      onAudio(btoa(binary));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stopRecording() {
    if (this.processor && this.source && this.audioContext) {
      this.source.disconnect();
      this.processor.disconnect();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.nextPlayTime = 0;
  }

  playPCM(base64Data: string, sampleRate: number = 24000) {
    if (!this.audioContext) return;

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768; // Convert Int16 to Float32
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };

    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    
    source.start(this.nextPlayTime);
    this.activeSources.push(source);
    
    // Add small buffer to prevent popping
    this.nextPlayTime += buffer.duration;
  }

  stopPlayback() {
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignore already stopped errors
      }
    });
    this.activeSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }
}
