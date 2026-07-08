import axios from 'axios';

// Local dev uses the Vite proxy ('/api' → http://localhost:8080).
// In production (e.g. Vercel) set VITE_API_URL to the deployed backend, e.g.
//   VITE_API_URL=https://codecampus-backend.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Code APIs
export const codeAPI = {
  execute: (data) => api.post('/code/execute', data),
  submit: (data) => api.post('/code/submit', data),
};

// Question APIs
export const questionAPI = {
  getAll: () => api.get('/questions'),
  getById: (id) => api.get(`/questions/${id}`),
  getStarter: (id, language) => api.get(`/questions/${id}/starter`, { params: { language } }),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
};

// Test APIs
export const testAPI = {
  getAll: () => api.get('/tests'),
  getActive: () => api.get('/tests/active'),
  getUpcoming: () => api.get('/tests/upcoming'),
  getById: (id) => api.get(`/tests/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  publish: (id) => api.put(`/tests/${id}/publish`),
  delete: (id, reason) => api.delete(`/tests/${id}`, { data: { reason } }),
  getMyTests: () => api.get('/tests/teacher'),
  getQuestionStatus: (id) => api.get(`/tests/${id}/question-status`),
  submitTest: (id) => api.post(`/tests/${id}/submit`),
  autoSubmitTest: (id) => api.post(`/tests/${id}/auto-submit`),
  resetCompletion: (testId, userId) => api.delete(`/tests/${testId}/completions/${userId}`),
  getCompletions: (testId) => api.get(`/tests/${testId}/completions`),
  getCompleted: () => api.get('/tests/completed'),
  isCompleted: (id) => api.get(`/tests/${id}/is-completed`),
  getLeaderboard: (id) => api.get(`/tests/${id}/leaderboard`),
  getSummary: (id) => api.get(`/tests/${id}/summary`),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  updateRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  toggleUser: (userId) => api.put(`/admin/users/${userId}/toggle`),
  resetPassword: (userId, password) => api.put(`/admin/users/${userId}/reset-password`, { password }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

export const profileAPI = {
  changePassword: (currentPassword, newPassword) => api.put('/profile/change-password', { currentPassword, newPassword }),
  checkUsername: (username) => api.get('/profile/username-available', { params: { username } }),
  updateUsername: (username) => api.put('/profile/username', { username }),
  getHistory: () => api.get('/profile/history'),
};

// Proctoring APIs
export const proctoringAPI = {
  logEvent: (data) => api.post('/proctoring/log', data),
  getStudentReport: (testId, userId) => api.get(`/proctoring/report/${testId}/student/${userId}`),
  getTestOverview: (testId) => api.get(`/proctoring/overview/${testId}`),
};

// Plagiarism APIs
export const plagiarismAPI = {
  runCheck: (testId) => api.post(`/plagiarism/check/${testId}`),
  getReports: (testId) => api.get(`/plagiarism/reports/${testId}`),
  compareCode: (code1, code2) => api.post('/plagiarism/compare', { code1, code2 }),
  updateStatus: (reportId, status, notes) => api.put(`/plagiarism/reports/${reportId}/status`, { status, notes }),
};

// Company APIs
export const companyAPI = {
  getDashboard: () => api.get('/company/dashboard'),
  createHiringTest: (data) => api.post('/company/hiring-test', data),
  getHiringTests: () => api.get('/company/hiring-tests'),
  getCandidates: (testId) => api.get(`/company/hiring-test/${testId}/candidates`),
};

// Batch & Section APIs
export const batchAPI = {
  getBatches: () => api.get('/batch-section/batches'),
  createBatch: (data) => api.post('/batch-section/batches', data),
  deleteBatch: (id) => api.delete(`/batch-section/batches/${id}`),
  getSections: (batchId) => api.get(`/batch-section/batches/${batchId}/sections`),
  getAllSections: () => api.get('/batch-section/sections'),
  createSection: (batchId, data) => api.post(`/batch-section/batches/${batchId}/sections`, data),
  addTeacher: (sectionId, teacherId) => api.post(`/batch-section/sections/${sectionId}/teachers`, { teacherId }),
  removeTeacher: (sectionId, teacherId) => api.delete(`/batch-section/sections/${sectionId}/teachers/${teacherId}`),
  getStudents: (sectionId) => api.get(`/batch-section/sections/${sectionId}/students`),
  toggleDebar: (studentId, isDebarred) => api.put(`/batch-section/students/${studentId}/debar`, { isDebarred }),
  deleteSection: (sectionId) => api.delete(`/batch-section/sections/${sectionId}`),
  deleteStudent: (studentId) => api.delete(`/batch-section/students/${studentId}`),
  downloadTemplate: () => api.get('/batch-section/csv-template', { responseType: 'blob' }),
  importCsv: (file, batchName) => { const fd = new FormData(); fd.append('file', file); if (batchName) fd.append('batchName', batchName); return api.post('/batch-section/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  getTracks: () => api.get('/batch-section/tracks'),
  addStudent: (data) => api.post('/batch-section/students', data),
};

// MCQ APIs
export const mcqAPI = {
  getQuestions: (testId, showAnswers = false) => api.get(`/mcq/tests/${testId}/questions?showAnswers=${showAnswers}`),
  saveQuestions: (testId, questions) => api.post(`/mcq/tests/${testId}/questions`, questions),
  submitAnswer: (questionId, selectedOption) => api.post('/mcq/answer', { questionId, selectedOption }),
  resetAnswers: (testId) => api.delete(`/mcq/tests/${testId}/reset`),
  getScore: (testId) => api.get(`/mcq/tests/${testId}/score`),
};

// Feedback / Report APIs
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getByQuestion: (questionId) => api.get(`/feedback/question/${questionId}`),
  getMy: () => api.get('/feedback/my'),
  getAll: () => api.get('/feedback/all'),
  getStats: () => api.get('/feedback/stats'),
  resolve: (id, note = '') => api.put(`/feedback/${id}/resolve`, { note }),
  dismiss: (id, note = '') => api.put(`/feedback/${id}/dismiss`, { note }),
};

// Notifications (persistent inbox)
export const notificationAPI = {
  list: (limit = 30) => api.get('/notifications', { params: { limit } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

export default api;
