import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      const response = await apiClient.post('/generate', { prompt, parameters });
      return response.data;
    } catch (error) {
      console.error('Update Design Error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update design');
    }
  },

  // Get model file from a URL
  getModelFile: async (modelUrl) => {
    if (!modelUrl || typeof modelUrl !== 'string') {
      throw new Error('Model URL must be a valid string.');
    }

    try {
      // Remove leading slash if present
      const cleanUrl = modelUrl.startsWith('/') ? modelUrl.slice(1) : modelUrl;

      // Handle both relative and absolute URLs
      const url = cleanUrl.startsWith('http') ? cleanUrl : `${API_BASE_URL}/${cleanUrl}`;

      console.log('Fetching model from:', url);

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        console.error('Model fetch failed. Status:', response.status);
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Model Download Error:', error);
      throw new Error(`Model download failed: ${error.message}`);
    }
  },
};

export default designApi;
