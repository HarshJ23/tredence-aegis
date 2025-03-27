"use client";

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-full">
      {/* Chat History */}
      <div className="flex-1 p-4 overflow-y-auto">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome to CAD Design Copilot</h3>
              <p className="max-w-md">
                Describe the 3D model you want to create, and I'll generate it for you.
                Try something like "Create a simple chair" or "Design a gear with 12 teeth".
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.modelData && (
                    <div className="mt-2 text-xs">
                      <p className="font-semibold">Generated model code:</p>
                      <pre className="bg-slate-700 text-slate-100 p-2 rounded mt-1 overflow-x-auto">
                        {msg.modelData.code.length > 100 
                          ? `${msg.modelData.code.substring(0, 100)}...` 
                          : msg.modelData.code}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <div className="border-t border-slate-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your design..."
            className="flex-1 p-2 border border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`p-2 rounded-r-md ${
              isLoading || !message.trim()
                ? 'bg-slate-300 text-slate-500'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-t-2 border-blue-200 border-solid rounded-full animate-spin"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;