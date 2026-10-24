import api from './api.js';

export const analysisService = {
  /**
   * Analyze image with AI
   * @param {File|Blob|string} image - Blob, File or base64 string
   * @param {string} mode - 'general' | 'text' | 'hazards' | 'currency' | 'people' | 'qa'
   * @param {string} customPrompt - Custom question if any
   */
  async analyzeImage(image, mode = 'general', customPrompt = '') {
    if (image instanceof Blob || image instanceof File) {
      const formData = new FormData();
      formData.append('imageFile', image, 'capture.jpg');
      formData.append('mode', mode);
      if (customPrompt) formData.append('customPrompt', customPrompt);

      const res = await api.post('/analysis/analyze', formData);
      return res.data;
    } else {
      // Base64 string
      const res = await api.post('/analysis/analyze', {
        image,
        mode,
        customPrompt
      });
      return res.data;
    }
  },

  async getHistory({ limit = 20, offset = 0, mode = '' } = {}) {
    let url = `/analysis/history?limit=${limit}&offset=${offset}`;
    if (mode && mode !== 'all') {
      url += `&mode=${encodeURIComponent(mode)}`;
    }
    const res = await api.get(url);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/analysis/${id}`);
    return res.data;
  },

  async deleteById(id) {
    const res = await api.delete(`/analysis/${id}`);
    return res;
  },

  async askFollowUp(id, question) {
    const res = await api.post(`/analysis/${id}/follow-up`, { question });
    return res.data;
  },

  async checkHealth() {
    const res = await api.get('/health');
    return res;
  }
};
