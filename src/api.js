import axios from 'axios';

// Replace this with your real base URL
const API_BASE_URL = 'https://172.16.226.95:5001/api';

// Get JWT token from localStorage or any auth store
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiUmlhejIiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc2VyIiwiZXhwIjoxNzU2ODMxOTk4LCJpc3MiOiJMaWJyYXJ5TWFuYWdlbWVudFN5c3RlbSIsImF1ZCI6IkxpYnJhcnlVc2VycyJ9.kIoc4F6_x4Spllcmjcr8yihDCVUI6RILe4esXrs2hGs";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,  // Send token with every request
    'Content-Type': 'application/json',
  },
});

export default api;