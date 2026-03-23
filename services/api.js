import axios from 'axios';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const safeFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    console.log('safeFetch error:', e.message);
    return null;
  }
};

// ─── AUTH ────────────────────────────────────────────────
export const getSession = async () => {
  return safeFetch(`${BASE_URL}/api/auth/session`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
};

export const signupUser = async (name, email, password) => {
  try {
    const res = await api.post('/api/signup', { name, email, password });
    return res.data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'Signup failed');
  }
};

// ─── ANALYZE ─────────────────────────────────────────────
export const analyzeImage = async (imageUri, mimeType = 'image/jpeg') => {
  try {
    const formData = new FormData();
    formData.append('image', { uri: imageUri, type: mimeType, name: 'upload.jpg' });
    const res = await api.post('/api/analyze-news', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'Image analysis failed');
  }
};

export const analyzeImageUrl = async (imageUrl) => {
  try {
    const res = await api.post('/api/analyze-news', { imageUrl });
    return res.data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'Image URL analysis failed');
  }
};

export const analyzeText = async (text) => {
  try {
    const res = await api.post('/api/analyze-text', { text });
    return res.data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'Text analysis failed');
  }
};

export const analyzeUrl = async (url) => {
  try {
    const res = await api.post('/api/analyze-url', { url });
    return res.data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'URL analysis failed');
  }
};

// ─── HISTORY ─────────────────────────────────────────────
export const getHistory = async () => {
  return safeFetch(`${BASE_URL}/api/history`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  }) ?? [];
};

export const clearHistory = async () => {
  return safeFetch(`${BASE_URL}/api/history`, {
    method: 'DELETE',
    credentials: 'include',
  }) ?? {};
};

// ─── LIVE NEWS ───────────────────────────────────────────
export const fetchLiveNews = async () => {
  return safeFetch(`${BASE_URL}/api/fetch-live-news`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  }) ?? [];
};

// ─── QUIZ ─────────────────────────────────────────────────
export const generateQuiz = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE_URL}/api/generate-quiz`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ topic: 'fake news detection', difficulty: 'medium' }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Quiz API error (${res.status})`);
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    throw new Error(e.message || 'Quiz generation failed');
  }
};

export const saveQuizScore = async (score, totalQuestions) => {
  return safeFetch(`${BASE_URL}/api/quiz-score`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, totalQuestions }),
  }) ?? {};
};

// ─── DASHBOARD ───────────────────────────────────────────
export const getDashboardStats = async () => {
  return safeFetch(`${BASE_URL}/api/dashboard-stats`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  }) ?? {};
};

// ─── USER ────────────────────────────────────────────────
export const getUserProfile = async () => {
  return safeFetch(`${BASE_URL}/api/user`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  }) ?? {};
};

export const updateProfile = async (data) => {
  return safeFetch(`${BASE_URL}/api/user/update-profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) ?? {};
};

export const sendFeedback = async (analysisId, feedback) => {
  return safeFetch(`${BASE_URL}/api/analysis-feedback`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, feedback }),
  }) ?? {};
};

export default api;
