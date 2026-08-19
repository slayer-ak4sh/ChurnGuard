import axios from "axios";

// In dev: React proxy forwards to http://localhost:8000
// In prod: set REACT_APP_API_URL to your deployed backend
const BASE = process.env.REACT_APP_API_URL || "";

const api = axios.create({ baseURL: BASE });

export const analyzeCustomer = (data) => api.post("/api/analyze", data).then((r) => r.data);
export const fetchCustomers = () => api.get("/api/customers").then((r) => r.data);
export const fetchCustomer = (id) => api.get(`/api/customers/${id}`).then((r) => r.data);
export const fetchDashboardStats = () => api.get("/api/dashboard/stats").then((r) => r.data);
export const fetchScores = () => api.get("/api/scores").then((r) => r.data);
