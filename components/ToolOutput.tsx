import React from 'react';
import { CheckCircle2, Clock, Terminal, AlertCircle, Mail, Calendar, StickyNote, CloudSun, Search } from 'lucide-react';
import { ToolCallData } from '../types';

interface ToolOutputProps {
  tool: ToolCallData;
}

export const ToolOutput: React.FC<ToolOutputProps> = ({ tool }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'send_email': return <Mail className="w-4 h-4" />;
      case 'schedule_meeting': return <Calendar className="w-4 h-4" />;
      case 'save_note': return <StickyNote className="w-4 h-4" />;
      case 'get_weather': return <CloudSun className="w-4 h-4" />;
      case 'googleSearch': return <Search className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  const isPending = tool.status === 'pending';
  const isError = tool.status === 'error';

  return (
    <div className={`mt-2 mb-2 rounded-md border ${
      isError ? 'border-red-800 bg-red-900/10' : 
      isPending ? 'border-astria-primary/30 bg-astria-primary/5' : 
      'border-astria-accent/30 bg-astria-accent/5'
    } overflow-hidden font-mono text-sm max-w-xl`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isError ? 'border-red-800/50 bg-red-900/20' : 
        isPending ? 'border-astria-primary/20 bg-astria-primary/10' : 
        'border-astria-accent/20 bg-astria-accent/10'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`${isPending ? 'text-astria-primary' : isError ? 'text-red-400' : 'text-astria-accent'}`}>
            {getIcon(tool.name)}
          </span>
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-xs">
            {tool.name.replace(/_/g, ' ')}
          </span>
        </div>
        <div>
          {isPending ? (
            <div className="flex items-center gap-1 text-astria-primary text-xs">
              <Clock className="w-3 h-3 animate-spin" />
              <span>EXECUTING</span>
            </div>
          ) : isError ? (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>FAILED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-astria-accent text-xs">
              <CheckCircle2 className="w-3 h-3" />
              <span>COMPLETE</span>
            </div>
          )}
        </div>
      </div>

      {/* Arguments */}
      <div className="px-3 py-2 bg-slate-900/50">
        <div className="text-slate-400 text-xs mb-1">INPUT</div>
        <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap break-all text-xs">
          {JSON.stringify(tool.args, null, 2)}
        </pre>
      </div>

      {/* Result (if complete) */}
      {!isPending && tool.result && (
        <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-800/30">
           <div className="text-slate-400 text-xs mb-1">OUTPUT</div>
           <pre className={`text-xs overflow-x-auto whitespace-pre-wrap break-all ${isError ? 'text-red-300' : 'text-astria-accent'}`}>
             {JSON.stringify(tool.result, null, 2)}
           </pre>
        </div>
      )}
    </div>
  );
};
