"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Code, Copy, Check, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const CodeSnippet = ({ code }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mt-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs px-2 py-1.5 rounded bg-slate-200 hover:bg-slate-300 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Code size={14} />
          <span className="font-medium">View CADQuery Code</span>
        </div>
        <div className="flex items-center">
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-1 rounded-md bg-slate-900 text-slate-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-700">
            <div className="flex items-center gap-1.5">
              <Code size={14} />
              <span className="text-xs font-medium">CADQuery Code</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-sm hover:bg-slate-800 hover:text-slate-200"
              onClick={copyToClipboard}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <pre className="px-4 py-3 overflow-x-auto text-xs">{code}</pre>
        </div>
      )}
    </div>
  );
};

const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={cn("flex items-start", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-3/4 rounded-lg p-4 my-1.5",
        isUser 
          ? "bg-blue-600 text-white rounded-tr-none"
          : "bg-slate-100 text-slate-900 rounded-tl-none"
      )}>
        <div className="prose prose-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          
          {message.modelData && message.modelData.code && (
            <CodeSnippet code={message.modelData.code} />
          )}
        </div>
      </div>
    </div>
  );
};

const WelcomeMessage = () => (
  <Card className="flex flex-col items-center justify-center p-8 mx-auto max-w-md text-center gap-4 bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="rounded-full p-3 bg-blue-100">
      <Info className="h-6 w-6 text-blue-600" />
    </div>
    <h3 className="text-lg font-semibold">Welcome to CAD Design Copilot</h3>
    <p className="text-slate-600 text-sm">
      Describe the 3D model you want to create, and I'll generate it for you.
      Try something like "Create a simple chair" or "Design a gear with 12 teeth".
    </p>
  </Card>
);

const DateSeparator = ({ date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
      {date}
    </div>
  </div>
);

const ChatInterface = ({ chatHistory, onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to the bottom when chat history changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Group messages by date - in a real app, you would have timestamps
  // This is a placeholder implementation
  const today = new Date().toLocaleDateString();

  return (
    <div className="flex flex-col h-full">
      {/* Chat History */}
      <ScrollArea className="flex-1 px-4 py-4">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <WelcomeMessage />
          </div>
        ) : (
          <div className="space-y-2">
            <DateSeparator date={today} />
            
            {chatHistory.map((msg, index) => (
              <MessageBubble 
                key={index} 
                message={msg} 
                isUser={msg.role === 'user'} 
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg rounded-tl-none p-4 my-1.5">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Input Form */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your design..."
            className="flex-1"
            disabled={isLoading}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isLoading || !message.trim()}
                  className={isLoading ? "bg-slate-200" : ""}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-t-2 border-blue-200 border-solid rounded-full animate-spin"></div>
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;