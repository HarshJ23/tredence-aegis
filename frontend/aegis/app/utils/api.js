import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tredence-backend.onrender.com';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const designApi = {
  // Generate a new design from a prompt
  generateDesign: async (prompt) => {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string.');
    }

    try {
      const response = await apiClient.post('/generate', { prompt });
      return response.data;
    } catch (error) {
      console.error('Generate Design Error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate design');
    }
  },

  // Update an existing design with new parameters
  updateDesign: async (prompt, parameters = {}) => {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string.');
    }

    try {
      // Use the dedicated endpoint for parameter updates
      const response = await apiClient.post('/update-parameters', { 
        prompt,
        parameters
      });
      return response.data;
    } catch (error) {
      console.error('Parameter update error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update design');
    }
  },

  // Get model file from a URL
  getModelFile: async (modelUrl) => {
    try {
      if (!modelUrl) {
        throw new Error('No model URL provided');
      }

      const cleanUrl = modelUrl.startsWith('/') ? modelUrl.substring(1) : modelUrl;
      const url = cleanUrl.startsWith('http') ? cleanUrl : `${API_BASE_URL}/${cleanUrl}`;
      const cacheBuster = `?t=${Date.now()}`;
      const fetchUrl = url + cacheBuster;

      console.log("Fetching model from:", fetchUrl);

      const response = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.error("Response status:", response.status);
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Model download error:", error);
      throw new Error(`Model download failed: ${error.message}`);
    }
  }
};

export default designApi;
