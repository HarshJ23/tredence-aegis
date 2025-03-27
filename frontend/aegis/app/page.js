"use client";

import { useState, useEffect } from 'react';
import ChatInterface from '@/app/SharedComponents/ChatInterface';
import ModelViewer from '@/app/SharedComponents/ModelViewer';
import ParameterPanel from '@/app/SharedComponents/ParameterPanel';
import StatusIndicator from '@/app/SharedComponents/StatusIndicator';
import designApi from '@/app/utils/api';
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [currentModel, setCurrentModel] = useState(null);
  const [parameters, setParameters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [viewerKey, setViewerKey] = useState(0);


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

  // const handleParameterChange = async (newParameters) => {
  //   try {
  //     setIsLoading(true);
  //     setParameters(newParameters);
      
  //     // Get the last user prompt from chat history
  //     const lastUserMessage = [...chatHistory]
  //       .reverse()
  //       .find(msg => msg.role === 'user');
        
  //     if (!lastUserMessage) {
  //       throw new Error('No previous prompt found');
  //     }
      
  //     // Call API with the original prompt and new parameters
  //     const data = await designApi.updateDesign(
  //       lastUserMessage.content, 
  //       newParameters
  //     );
      
  //     // Update model data
  //     setCurrentModel(data);
      
  //     // Important: Store the current URL so we don't lose it
  //     const currentUrl = modelUrl;
      
  //     // Set the new URL - use view_url for viewing if available
  //     if (data.view_url) {
  //       setModelUrl(data.view_url);
  //     } else if (data.model_url) {
  //       setModelUrl(data.model_url);
  //     } else {
  //       // If no new URL is provided, keep the current one
  //       console.warn('No model URL in response, keeping current model');
  //       // But we still need to trigger a reload, so set to null and then back
  //       setModelUrl(null);
  //       // Use setTimeout to ensure the state update happens in separate cycles
  //       setTimeout(() => {
  //         setModelUrl(currentUrl);
  //       }, 50);
  //     }
      
  //     // Add a system message about the parameter update
  //     setChatHistory(prev => [...prev, { 
  //       role: 'system', 
  //       content: 'Design updated with new parameters.',
  //       modelData: data
  //     }]);
  //   } catch (error) {
  //     console.error('Error updating parameters:', error);
  //     setChatHistory(prev => [...prev, { 
  //       role: 'system', 
  //       content: `Error updating parameters: ${error.message}` 
  //     }]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


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
      
      // Update model data
      setCurrentModel(data);
      
      // Determine which URL to use
      const newUrl = data.view_url || data.model_url;
      
      // Force complete re-render of the ModelViewer component
      // by updating the key and the URL at the same time
      setModelUrl(null); // Clear first
      setTimeout(() => {
        setModelUrl(newUrl);
        setViewerKey(prevKey => prevKey + 1); // Increment key to force remount
      }, 50);
      
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
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-slate-200 bg-white z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Aegis - CAD Design Agent</h1>
          {/* <div className="flex items-center gap-4">
            <StatusIndicator />
          </div> */}
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col">
          <ChatInterface 
            chatHistory={chatHistory}
            onSendMessage={handleSendPrompt}
            isLoading={isLoading}
          />
        </div>
        
        {/* Model Viewer */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <ModelViewer 
              modelUrl={modelUrl}
              isLoading={isLoading}
            />
          </div>
          
          {/* Parameter Panel */}
          {currentModel && (
            <>
              <Separator className="my-0" />
              <div className="h-1/3 overflow-auto">
                <ParameterPanel 
                  parameters={parameters}
                  onParameterChange={handleParameterChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}