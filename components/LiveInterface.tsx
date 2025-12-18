import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Power, Activity } from 'lucide-react';
import { GeminiLiveService } from '../services/geminiService';

const LiveInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [volume, setVolume] = useState(0);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    liveServiceRef.current = new GeminiLiveService();
    
    liveServiceRef.current.onVolumeChange = (vol) => {
      setVolume(vol);
    };

    liveServiceRef.current.onClose = () => {
      setIsConnected(false);
      setVolume(0);
    };

    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const toggleConnection = async () => {
    if (isConnected) {
      liveServiceRef.current?.disconnect();
      setIsConnected(false);
    } else {
      setIsError(false);
      try {
        await liveServiceRef.current?.connect((text) => {
          // Optional: handle interim text if we enabled transcription
        });
        setIsConnected(true);
      } catch (err) {
        console.error(err);
        setIsError(true);
      }
    }
  };

  // Simple Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw idle line or active wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      if (isConnected) {
        // Create a wave based on volume
        const segments = 50;
        for (let i = 0; i < segments; i++) {
          const x = (i / segments) * width;
          // Add some randomness and time factor for movement
          const time = Date.now() / 100;
          const amplitude = Math.min(volume * 2, height / 3); 
          const y = (height / 2) + Math.sin(i * 0.5 + time) * amplitude * Math.sin(i / segments * Math.PI); // Envelope
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#4f46e5'; // Indigo 600
        ctx.lineWidth = 3;
      } else {
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#334155'; // Slate 700
        ctx.lineWidth = 2;
      }
      
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isConnected, volume]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      <div className="z-10 flex flex-col items-center gap-8 max-w-lg w-full">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Gemini Live</h2>
          <p className="text-slate-400">Real-time conversational AI. Speak naturally.</p>
        </div>

        {/* Visualizer Container */}
        <div className="w-full h-48 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center relative backdrop-blur-sm overflow-hidden shadow-2xl">
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={200} 
            className="w-full h-full absolute top-0 left-0"
          />
          {!isConnected && !isError && (
             <div className="text-slate-500 flex items-center gap-2 z-10">
               <Activity size={20} />
               <span>Ready to connect</span>
             </div>
          )}
          {isError && (
            <div className="text-red-400 z-10">Connection Failed</div>
          )}
        </div>

        {/* Controls */}
        <button
          onClick={toggleConnection}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
              : 'bg-white hover:bg-indigo-50 text-indigo-600 shadow-indigo-500/20'
          }`}
        >
          {isConnected ? (
             <Power size={32} className="text-white" />
          ) : (
             <Mic size={32} />
          )}
        </button>

        <div className="h-4">
           {isConnected && (
             <span className="text-sm text-emerald-400 animate-pulse font-medium">
               Live Session Active
             </span>
           )}
        </div>
        
        <div className="text-xs text-slate-500 text-center max-w-xs">
          Ensure your microphone permission is granted. Audio is streamed directly to Gemini.
        </div>
      </div>
    </div>
  );
};

export default LiveInterface;