const API_BASE = import.meta.env.VITE_API_BASE || 'https://crypto-backend-wheat.vercel.app/api';

async function request(method, path, body = null) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const signup = (name, email, password) =>
  request('POST', '/auth/signup', { name, email, password });

export const login = (email, password) =>
  request('POST', '/auth/login', { email, password });

// Modules
export const getModules = () => request('GET', '/modules');
export const getModule = (id) => request('GET', `/modules/${id}`);

// Progress
export const getProgress = () => request('GET', '/progress');
export const completeLesson = (moduleId) =>
  request('POST', '/progress/completeLesson', { moduleId });

// Quiz
export const getQuiz = (moduleId) => request('GET', `/quiz/${moduleId}`);
export const submitQuiz = (moduleId, answers) =>
  request('POST', '/quiz/submit', { moduleId, answers });

// Achievements
export const getAchievements = () => request('GET', '/achievements');

// Profile
export const getProfile = () => request('GET', '/auth/profile');
export const updateProfile = (fields) =>
  request('PUT', '/auth/profile', fields);
export const changePassword = (password) =>
  request('PUT', '/auth/change-password', { password });
export const checkUsername = (name) =>
  request('GET', `/auth/check-username?name=${encodeURIComponent(name)}`);
export const uploadProfilePicture = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('profilePicture', file);
  const res = await fetch(`${API_BASE}/auth/profile/picture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
};

// Leaderboard
export const getLeaderboard = () => request('GET', '/leaderboard');

// Simulator
export const getPortfolio = () => request('GET', '/simulator/portfolio');
export const executeTrade = (crypto, type, amount, stopLoss = null) =>
  request('POST', '/simulator/trade', { crypto, type, amount, stopLoss });
export const getHistory = () => request('GET', '/simulator/history');
export const setStopLoss = (crypto, price) =>
  request('POST', '/simulator/stop-loss', { crypto, price });
export const getChartData = (symbol, days) => request('GET', `/simulator/chart/${symbol}?days=${days}`);

// Futures
export const getFuturesPortfolio = () => request('GET', '/futures/portfolio');
export const openFuturesPosition = (crypto, direction, leverage, margin, takeProfit = null, stopLoss = null) =>
  request('POST', '/futures/open', { crypto, direction, leverage, margin, takeProfit, stopLoss });
export const closeFuturesPosition = (positionId) =>
  request('POST', '/futures/close', { positionId });
export const updateFuturesOrders = (positionId, takeProfit, stopLoss) =>
  request('PUT', '/futures/orders', { positionId, takeProfit, stopLoss });
export const getFuturesHistory = () => request('GET', '/futures/history');
export const getFuturesPriceTick = () => request('GET', '/futures/tick');

// Admin
export const getAdminStats = () => request('GET', '/admin/stats');
export const getAdminUsers = () => request('GET', '/admin/users');
export const getAdminUser = (uid) => request('GET', `/admin/users/${uid}`);
export const updateAdminUser = (uid, fields) => request('PUT', `/admin/users/${uid}`, fields);
export const deleteAdminUser = (uid) => request('DELETE', `/admin/users/${uid}`);
export const getAdminModules = () => request('GET', '/admin/modules');
export const createAdminModule = (fields) => request('POST', '/admin/modules', fields);
export const updateAdminModule = (id, fields) => request('PUT', `/admin/modules/${id}`, fields);
export const updateAdminModuleContent = (id, content) => request('PUT', `/admin/modules/${id}/content`, { content });
export const deleteAdminModule = (id) => request('DELETE', `/admin/modules/${id}`);
export const getAdminModuleQuiz = (id) => request('GET', `/admin/modules/${id}/quiz`);
export const saveAdminModuleQuiz = (id, questions) => request('PUT', `/admin/modules/${id}/quiz`, { questions });
export const getAdminScores = () => request('GET', '/admin/scores');
export const resetAdminProgress = (progressId) => request('DELETE', `/admin/scores/${progressId}`);
