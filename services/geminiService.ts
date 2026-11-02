import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './audioUtils';

// --- Chat Service ---

export const sendChatMessageStream = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
  image: string | undefined, // Base64 string
  onChunk: (text: string) => void
) => {
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        message,
        image,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            onChunk(parsed.text);
          } else if (parsed.error) {
            console.error('Server chat error:', parsed.error);
          }
        } catch {
          // ignore json parse error on partial lines
        }
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
  private ws: WebSocket | null = null;
  private stream: MediaStream | null = null;

  // Callbacks for UI updates
  public onVolumeChange: ((vol: number) => void) | null = null;
  public onClose: (() => void) | null = null;

  async connect(onMessage: (text: string | null) => void) {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to server Live API WebSocket proxy");
        this.startAudioProcessing();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.data && this.outputAudioContext) {
            const audioBuffer = await decodeAudioData(
              base64ToUint8Array(msg.data),
              this.outputAudioContext
            );

            // Schedule gapless playback
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputAudioContext.destination);
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
          } else if (msg.type === 'interrupted') {
            console.log("Interrupted!");
            this.nextStartTime = 0;
          } else if (msg.type === 'turnComplete') {
            onMessage(null);
          } else if (msg.type === 'closed') {
            if (this.onClose) this.onClose();
          } else if (msg.type === 'error') {
            console.error("Server Live API error:", msg.error);
          }
        } catch (e) {
          console.error("Error processing server WS message:", e);
        }
      };

      this.ws.onclose = () => {
        console.log("Live WebSocket closed");
        if (this.onClose) this.onClose();
      };

      this.ws.onerror = (err) => {
        console.error("Live WebSocket error:", err);
      };

    } catch (error) {
      console.error("Failed to connect live session:", error);
      throw error;
    }
  }

  private startAudioProcessing() {
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

      // Create PCM blob and send to server WS proxy
      const pcmBlob = createPcmBlob(inputData);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'realtime_input',
          media: pcmBlob
        }));
      }
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) { /* ignore */ }
    }

    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());

    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.ws = null;
  }
}