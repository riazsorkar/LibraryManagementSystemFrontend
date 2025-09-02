import axios from 'axios';

// Replace this with your real base URL
const API_BASE_URL = 'https://localhost:5001/api';

// Get JWT token from localStorage or any auth store
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjYiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoic3RyaW5nIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQWRtaW4iLCJleHAiOjE3NTY4MjI2MzksImlzcyI6IkxpYnJhcnlNYW5hZ2VtZW50U3lzdGVtIiwiYXVkIjoiTGlicmFyeVVzZXJzIn0.mY5qZVv_0tGCsVKz2Cr4WLWZFXhSNkN2OzB21ubAA-c";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,  // Send token with every request
    'Content-Type': 'application/json',
  },
});

export default api;