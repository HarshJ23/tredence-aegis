"use client";

import { useState, useEffect } from 'react';
import { Sliders, RefreshCw } from 'lucide-react';

const ParameterPanel = ({ parameters, onParameterChange }) => {
  const [localParameters, setLocalParameters] = useState({});
  const [isApplying, setIsApplying] = useState(false);

  // Initialize local parameters when props change
  useEffect(() => {
    setLocalParameters(parameters);
  }, [parameters]);

  const handleSliderChange = (paramName, newValue) => {
    setLocalParameters(prev => ({
      ...prev,
      [paramName]: {
        ...prev[paramName],
        value: Number(newValue)
      }
    }));
  };

  const handleApplyChanges = async () => {
    setIsApplying(true);
    try {
      await onParameterChange(localParameters);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetParameters = () => {
    setLocalParameters(parameters);
  };

  // Check if parameters have been modified
  const areParametersModified = () => {
    if (!parameters || !localParameters) return false;
    
    return Object.keys(parameters).some(key => {
      return parameters[key]?.value !== localParameters[key]?.value;
    });
  };

  const isModified = areParametersModified();

  if (!parameters || Object.keys(parameters).length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>No parameters available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Sliders className="mr-2" size={20} />
          Parameters
        </h3>
        {isModified && (
          <div className="flex space-x-2">
            <button
              onClick={handleResetParameters}
              className="text-xs px-2 py-1 text-slate-600 hover:text-slate-800"
              title="Reset to original values"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleApplyChanges}
              disabled={isApplying}
              className={`text-xs px-3 py-1 rounded ${
                isApplying
                  ? 'bg-slate-300 text-slate-500'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isApplying ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(localParameters).map(([paramName, paramData]) => (
          <div key={paramName} className="space-y-1">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-700">
                {paramName.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
              </label>
              <span className="text-sm text-slate-500">
                {paramData.value}
              </span>
            </div>
            <input
              type="range"
              min={paramData.min}
              max={paramData.max}
              step={(paramData.max - paramData.min) / 100}
              value={paramData.value}
              onChange={(e) => handleSliderChange(paramName, e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{paramData.min}</span>
              <span>{paramData.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterPanel;