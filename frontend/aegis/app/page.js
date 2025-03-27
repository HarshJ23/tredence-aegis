"use client";

import { useState, useEffect } from 'react';
import ChatInterface from '@/app/components/ChatInterface';
import ModelViewer from '@/app/components/ModelViewer';
import ParameterPanel from '@/app/components/ParameterPanel';
import designApi from '@/app/utils/api';

export default function Home() {
  const [currentModel, setCurrentModel] = useState(null);
  const [parameters, setParameters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

// In page.js, modify the handleSendPrompt function
const handleSendPrompt = async (prompt) => {
  try {
    setIsLoading(true);
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content: prompt 
    }]);

    // Call your backend API using the designApi service
    const data = await designApi.generateDesign(prompt);
    
    // Update state with model data
    setCurrentModel(data);
    setParameters(data.parameters);
    
    // Use view_url for viewing and model_url for downloading if available
    if (data.view_url) {
      setModelUrl(data.view_url); // For viewing in Three.js
    } else {
      setModelUrl(data.model_url); // Fallback
    }
    
    // Add system response to chat history
    setChatHistory(prev => [...prev, { 
      role: 'system', 
      content: data.description || 'Here is your design.',
      modelData: data
    }]);
  } catch (error) {
    console.error('Error:', error);
    setChatHistory(prev => [...prev, { 
      role: 'system', 
      content: `Error: ${error.message}` 
    }]);
  } finally {
    setIsLoading(false);
  }
};

  const handleParameterChange = async (newParameters) => {
    try {
      setIsLoading(true);
      setParameters(newParameters);
      
      // Get the last user prompt from chat history
      const lastUserMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === 'user');
        
      if (!lastUserMessage) {
        throw new Error('No previous prompt found');
      }
      
      // Call API with the original prompt and new parameters
      const data = await designApi.updateDesign(
        lastUserMessage.content, 
        newParameters
      );
      
      // Update model data and URL
      setCurrentModel(data);
      setModelUrl(data.model_url);
      
      // Add a system message about the parameter update
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: 'Design updated with new parameters.',
        modelData: data
      }]);
    } catch (error) {
      console.error('Error updating parameters:', error);
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `Error updating parameters: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-slate-800 text-white p-4">
        <h1 className="text-2xl font-bold">CAD Design Copilot</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/3 border-r border-slate-200">
          <ChatInterface 
            chatHistory={chatHistory}
            onSendMessage={handleSendPrompt}
            isLoading={isLoading}
          />
        </div>
        
        {/* Model Viewer */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <ModelViewer 
              modelUrl={modelUrl}
              isLoading={isLoading}
            />
          </div>
          
          {/* Parameter Panel */}
          {currentModel && (
            <div className="h-1/3 border-t border-slate-200">
              <ParameterPanel 
                parameters={parameters}
                onParameterChange={handleParameterChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}