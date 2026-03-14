import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajoute le token JWT à chaque requête
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('session_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['Cookie'] = token;
    }
  } catch {}
  return config;
});

// ─── AUTH ────────────────────────────────────────────────
export const loginWithCredentials = async (email, password) => {
  const csrfRes = await api.get('/api/auth/csrf');
  const { csrfToken } = csrfRes.data;
  const res = await api.post('/api/auth/callback/credentials', {
    email, password, csrfToken, redirect: false, json: true,
  }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return res.data;
};

export const getSession = async () => {
  const res = await api.get('/api/auth/session');
  return res.data;
};

export const signupUser = async (name, email, password) => {
  const res = await api.post('/api/signup', { name, email, password });
  return res.data;
};

// ─── ANALYZE ─────────────────────────────────────────────
export const analyzeImage = async (imageUri, mimeType = 'image/jpeg') => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: mimeType,
    name: 'upload.jpg',
  });
  const res = await api.post('/api/analyze-news', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data;
};

export const analyzeImageUrl = async (imageUrl) => {
  const res = await api.post('/api/analyze-news', { imageUrl });
  return res.data;
};

export const analyzeText = async (text) => {
  const res = await api.post('/api/analyze-text', { text });
  return res.data;
};

export const analyzeUrl = async (url) => {
  const res = await api.post('/api/analyze-url', { url });
  return res.data;
};

// ─── HISTORY ─────────────────────────────────────────────
export const getHistory = async () => {
  const res = await api.get('/api/history');
  return res.data;
};

export const clearHistory = async () => {
  const res = await api.delete('/api/history');
  return res.data;
};

// ─── LIVE NEWS ───────────────────────────────────────────
export const fetchLiveNews = async () => {
  const res = await api.get('/api/fetch-live-news');
  return res.data;
};

// ─── QUIZ ────────────────────────────────────────────────
export const generateQuiz = async () => {
  const res = await api.get('/api/generate-quiz');
  return res.data;
};

export const saveQuizScore = async (score, totalQuestions) => {
  const res = await api.post('/api/quiz-score', { score, totalQuestions });
  return res.data;
};

// ─── DASHBOARD ───────────────────────────────────────────
export const getDashboardStats = async () => {
  const res = await api.get('/api/dashboard-stats');
  return res.data;
};

// ─── USER ────────────────────────────────────────────────
export const getUserProfile = async () => {
  const res = await api.get('/api/user');
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/api/user/update-profile', data);
  return res.data;
};

export const sendFeedback = async (analysisId, feedback) => {
  const res = await api.post('/api/analysis-feedback', { analysisId, feedback });
  return res.data;
};

export default api;
