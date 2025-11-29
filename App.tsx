import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Menu, Plus } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Message, MessageRole, ToolCallData } from './types';
import { sendMessageToAstria, initializeGemini } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: "I am ASTRIA, your automation engine. I can send emails, schedule meetings, save notes, and search the web. How can I assist you today?",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini on mount
  useEffect(() => {
    try {
      initializeGemini();
    } catch (e) {
      console.error("Failed to init gemini", e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: inputValue,
      timestamp: Date.now()
    };

    // Optimistic Update
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Create a placeholder message for ASTRIA's response
    const botMsgId = (Date.now() + 1).toString();
    const loadingMsg: Message = {
      id: botMsgId,
      role: MessageRole.MODEL,
      isThinking: true,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      // Callback when tools start executing (update the placeholder)
      const onToolStart = (tools: ToolCallData[]) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === botMsgId) {
            return { ...msg, toolCalls: tools };
          }
          return msg;
        }));
      };

      // Callback when tools complete (update the placeholder)
      const onToolComplete = (tools: ToolCallData[]) => {
         setMessages(prev => prev.map(msg => {
          if (msg.id === botMsgId) {
            return { ...msg, toolCalls: tools };
          }
          return msg;
        }));
      };

      // Call API
      const response = await sendMessageToAstria(
        userMsg.text || "", 
        onToolStart, 
        onToolComplete
      );

      // Final Update
      setMessages(prev => prev.map(msg => {
        if (msg.id === botMsgId) {
          return {
            ...msg,
            isThinking: false,
            text: response.text,
            // Keep existing tool calls if they were added via callbacks, otherwise use response
            toolCalls: msg.toolCalls || response.toolCalls 
          };
        }
        return msg;
      }));

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === botMsgId) {
          return {
            ...msg,
            isThinking: false,
            text: "I encountered an error processing your request. Please ensure the API key is valid and try again."
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-astria-bg text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col border-r border-astria-border bg-astria-panel/30 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-8 text-astria-primary">
          <Zap className="w-6 h-6 fill-current" />
          <h1 className="text-xl font-bold tracking-tight">ASTRIA</h1>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 w-full px-4 py-2 mb-4 text-sm font-medium bg-astria-primary/10 text-astria-primary border border-astria-primary/20 rounded-md hover:bg-astria-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>

        <div className="mt-auto">
          <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Capabilities</div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-astria-primary"></span>
              Email Automation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-astria-primary"></span>
              Meeting Scheduler
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-astria-primary"></span>
              Note Taking
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-astria-primary"></span>
              Web Search
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header - Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-astria-border bg-astria-bg/80 backdrop-blur">
          <div className="flex items-center gap-2 text-astria-primary">
            <Zap className="w-5 h-5 fill-current" />
            <h1 className="text-lg font-bold">ASTRIA</h1>
          </div>
          <button className="p-2 text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-astria-border bg-astria-bg/95 backdrop-blur z-10">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Astria to schedule a meeting, send an email, or search..."
              className="w-full bg-astria-panel border border-astria-border rounded-xl pl-4 pr-12 py-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-astria-primary/50 focus:ring-1 focus:ring-astria-primary/50 resize-none shadow-lg"
              rows={1}
              style={{ minHeight: '60px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                inputValue.trim() && !isLoading
                  ? 'bg-astria-primary text-astria-bg hover:bg-cyan-400' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-3xl mx-auto mt-2 text-center">
             <p className="text-[10px] text-slate-600 font-mono">POWERED BY GEMINI 2.5 • ASTRIA AUTOMATION ENGINE</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
