"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const StatusIndicator = ({ backend = 'http://localhost:8000' }) => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking connection...');

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        setStatus('checking');
        setMessage('Checking connection...');
        
        // Try to fetch from backend
        const response = await fetch(`${backend}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // For quick timeout
          signal: AbortSignal.timeout(3000),
        });
        
        if (response.ok) {
          setStatus('connected');
          setMessage('Backend connected');
        } else {
          setStatus('error');
          setMessage(`Error: ${response.statusText}`);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.name === 'AbortError' 
          ? 'Connection timed out' 
          : `Connection failed: ${error.message}`);
      }
    };

    // Check status immediately
    checkBackendStatus();
    
    // And then every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, [backend]);

  const renderIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
      default:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-slate-100">
            {renderIcon()}
            <span className="font-medium text-slate-700">
              {status === 'connected' ? 'Connected' : status === 'error' ? 'Disconnected' : 'Connecting...'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatusIndicator;