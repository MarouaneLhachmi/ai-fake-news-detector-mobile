import axios from 'axios';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── AUTH ────────────────────────────────────────────────
export const getSession = async () => {
  const res = await fetch(`${BASE_URL}/api/auth/session`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
};

export const signupUser = async (name, email, password) => {
  const res = await api.post('/api/signup', { name, email, password });
  return res.data;
};

// ─── ANALYZE ─────────────────────────────────────────────
export const analyzeImage = async (imageUri, mimeType = 'image/jpeg') => {
  const formData = new FormData();
  formData.append('image', { uri: imageUri, type: mimeType, name: 'upload.jpg' });
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
  const res = await fetch(`${BASE_URL}/api/history`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
};

export const clearHistory = async () => {
  const res = await fetch(`${BASE_URL}/api/history`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

// ─── LIVE NEWS ───────────────────────────────────────────
export const fetchLiveNews = async () => {
  const res = await fetch(`${BASE_URL}/api/fetch-live-news`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
};

// ─── QUIZ ─────────────────────────────────────────────────
// ⚠️ Backend requires POST with JSON body (topic + difficulty)
export const generateQuiz = async () => {
  const res = await fetch(`${BASE_URL}/api/generate-quiz`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ topic: 'fake news detection', difficulty: 'medium' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Quiz API error (${res.status})`);
  }
  return res.json();
};

export const saveQuizScore = async (score, totalQuestions) => {
  const res = await fetch(`${BASE_URL}/api/quiz-score`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, totalQuestions }),
  });
  return res.json();
};

// ─── DASHBOARD ───────────────────────────────────────────
export const getDashboardStats = async () => {
  const res = await fetch(`${BASE_URL}/api/dashboard-stats`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
};

// ─── USER ────────────────────────────────────────────────
export const getUserProfile = async () => {
  const res = await fetch(`${BASE_URL}/api/user`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
};

export const updateProfile = async (data) => {
  const res = await fetch(`${BASE_URL}/api/user/update-profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const sendFeedback = async (analysisId, feedback) => {
  const res = await fetch(`${BASE_URL}/api/analysis-feedback`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, feedback }),
  });
  return res.json();
};

export default api;
