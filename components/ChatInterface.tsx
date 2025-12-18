import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { sendChatMessageStream } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm Nexus. I can see images and help you with code, reasoning, or creative tasks. How can I help today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for API usage if necessary, but here we keep it for display
        // and strip it right before sending.
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    const imageToSend = selectedImage ? selectedImage.split(',')[1] : undefined;
    setSelectedImage(null);
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    }]);

    try {
      // Build history for context (excluding current message and image-only messages for simplicity in this demo)
      const history = messages
        .filter(m => m.role !== 'user' || !m.image) // Simple text history
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      let accumulatedText = '';
      
      await sendChatMessageStream(history, newUserMsg.text, imageToSend, (chunk) => {
        accumulatedText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === botMsgId 
            ? { ...m, text: accumulatedText }
            : m
        ));
      });

    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === botMsgId 
          ? { ...m, text: "Sorry, I encountered an error processing your request." }
          : m
      ));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, isStreaming: false } : m
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="User upload" 
                  className="max-w-xs rounded-lg mb-2 border border-slate-700" 
                />
              )}
              <div className={`px-4 py-2 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-sm' 
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.text ? (
                   <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                     {msg.text}
                   </ReactMarkdown>
                ) : (
                  <span className="animate-pulse">...</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/50 border-t border-slate-700 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
             <div className="relative inline-block mb-2">
               <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-slate-600" />
               <button 
                 onClick={() => setSelectedImage(null)}
                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
               >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
             </div>
          )}
          
          <div className="flex gap-2 items-end">
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-3 text-slate-400 hover:text-indigo-400 transition-colors rounded-xl hover:bg-slate-700/50"
               title="Upload Image"
             >
               <ImageIcon size={20} />
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleImageUpload}
             />
             
             <div className="flex-1 relative">
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Ask Nexus anything..."
                 className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                 rows={1}
                 style={{ minHeight: '46px', maxHeight: '120px' }}
               />
             </div>
             
             <button 
               onClick={handleSend}
               disabled={isLoading || (!input.trim() && !selectedImage)}
               className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                 isLoading || (!input.trim() && !selectedImage)
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
               }`}
             >
               {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
             </button>
          </div>
          <div className="text-center text-xs text-slate-500 mt-2">
            Gemini may display inaccurate info, including about people, so double-check its responses.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
