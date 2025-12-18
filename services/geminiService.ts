import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './audioUtils';

// --- Chat Service ---

export const sendChatMessageStream = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
  image: string | undefined, // Base64 string
  onChunk: (text: string) => void
) => {
  try {
    // Initialize right before usage to ensure current API key is picked up
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview'; 
    
    // Multi-modal check
    if (image) {
       const responseStream = await ai.models.generateContentStream({
         model,
         contents: {
           parts: [
             { inlineData: { mimeType: 'image/jpeg', data: image } },
             { text: message }
           ]
         }
       });
       
       for await (const chunk of responseStream) {
         if (chunk.text) {
           onChunk(chunk.text);
         }
       }
       return;
    }

    // Text-only chat using the chat helper
    const chat = ai.chats.create({
      model,
      config: {
        history: history as any,
      }
    });

    const result = await chat.sendMessageStream({ message });
    
    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }

  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};


// --- Live Service ---

export class GeminiLiveService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sessionPromise: Promise<any> | null = null;
  private session: any = null;
  private stream: MediaStream | null = null;
  
  // Callbacks for UI updates
  public onVolumeChange: ((vol: number) => void) | null = null;
  public onClose: (() => void) | null = null;

  async connect(onMessage: (text: string | null) => void) {
    try {
      // Re-initialize client to pick up potentially new key selections
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: (msg) => this.handleMessage(msg, onMessage),
          onclose: () => {
            console.log("Session closed");
            if (this.onClose) this.onClose();
          },
          onerror: (err) => console.error("Session error:", err),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are a helpful, witty, and concise AI assistant named Nexus.",
        },
      });
      
      this.session = await this.sessionPromise;

    } catch (error) {
      console.error("Failed to connect live session:", error);
      throw error;
    }
  }

  private handleOpen() {
    console.log("Live Session Opened");
    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const volume = Math.sqrt(sum / inputData.length) * 100;
      if (this.onVolumeChange) this.onVolumeChange(volume);

      // Create blob and send via the resolved session promise to avoid race conditions
      const pcmBlob = createPcmBlob(inputData);
      
      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, onMessage: (text: string | null) => void) {
    // 1. Handle Audio output stream from model
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext) {
      const audioBuffer = await decodeAudioData(
        base64ToUint8Array(base64Audio),
        this.outputAudioContext
      );
      
      // Schedule gapless playback
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    }

    // 2. Handle Interruption by model or VAD
    if (message.serverContent?.interrupted) {
      console.log("Interrupted!");
      this.nextStartTime = 0;
      // Note: Real implementation would stop active AudioBufferSourceNodes here
    }

    // 3. Handle Turn Complete
    if (message.serverContent?.turnComplete) {
       // Visual cues can be added here
    }
  }

  disconnect() {
    if (this.session) {
       try {
         // Explicitly close the session to release backend resources
         this.session.close && this.session.close();
       } catch (e) { /* ignore */ }
    }
    
    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.session = null;
    this.sessionPromise = null;
  }
}