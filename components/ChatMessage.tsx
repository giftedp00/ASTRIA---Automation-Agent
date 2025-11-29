import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole } from '../types';
import { Bot, User, Globe } from 'lucide-react';
import { ToolOutput } from './ToolOutput';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
          isUser ? 'bg-slate-700 text-white' : 'bg-astria-primary/20 text-astria-primary border border-astria-primary/50'
        }`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-4 py-3 shadow-md ${
            isUser 
              ? 'bg-astria-secondary/20 text-white border border-slate-700 rounded-tr-none' 
              : 'bg-astria-panel text-slate-100 border border-astria-border rounded-tl-none'
          }`}>
            
            {/* Tool Calls Display */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mb-3 flex flex-col gap-2">
                {message.toolCalls.map((tool) => (
                  <ToolOutput key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {/* Text Content */}
            {message.text && (
              <div className={`prose prose-invert prose-sm max-w-none ${isUser ? 'text-right' : 'text-left'}`}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}

            {/* Loading State Indicator */}
            {message.isThinking && (
               <div className="flex items-center gap-2 mt-2 text-astria-primary/70 text-sm animate-pulse">
                 <div className="w-2 h-2 rounded-full bg-astria-primary animate-bounce" style={{ animationDelay: '0ms'}}></div>
                 <div className="w-2 h-2 rounded-full bg-astria-primary animate-bounce" style={{ animationDelay: '150ms'}}></div>
                 <div className="w-2 h-2 rounded-full bg-astria-primary animate-bounce" style={{ animationDelay: '300ms'}}></div>
                 <span>ASTRIA is processing...</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
