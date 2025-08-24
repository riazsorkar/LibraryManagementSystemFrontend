import axios from 'axios';

// Replace this with your real base URL
const API_BASE_URL = 'https://192.168.100.139:5001/api';

// Get JWT token from localStorage or any auth store
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjciLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiUmlhejUiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc2VyIiwiZXhwIjoxNzU2MDcwOTQ0LCJpc3MiOiJMaWJyYXJ5TWFuYWdlbWVudFN5c3RlbSIsImF1ZCI6IkxpYnJhcnlVc2VycyJ9.lJjPH2O4W_od0hay9wGc-6rrZKfmxH9sbzkQaQIOecE";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,  // Send token with every request
    'Content-Type': 'application/json',
  },
});

export default api;