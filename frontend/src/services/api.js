import axios from 'axios';

const API_BASE_URL = 'https://hotelflow-production-738f.up.railway.app/api';

export const TOKEN_KEY = 'hotelflow_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the stored JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 the session is invalid/expired → clear it and bounce to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('hotelflow_auth');
      localStorage.removeItem('hotelflow_user');
      // Avoid a redirect loop if we're already on the login screen.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Exchange credentials for a token; caller stores it.
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // { token, user }
  },

  // Validate a stored token and fetch the current user.
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data; // { user }
  },
};

export const ticketAPI = {
  // Get all tickets
  getTickets: async () => {
    const response = await api.get('/tickets');
    return response.data;
  },

  // Get single ticket
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Create ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  // Update ticket
  updateTicket: async (id, updates) => {
    const response = await api.patch(`/tickets/${id}`, updates);
    return response.data;
  },

  // Add note
  addNote: async (id, author, text) => {
    const response = await api.post(`/tickets/${id}/notes`, { author, text });
    return response.data;
  },

  // Send an email reply to the guest
  replyToTicket: async (id, { subject, body, author }) => {
    const response = await api.post(`/tickets/${id}/reply`, { subject, body, author });
    return response.data;
  },

  // Get an AI-suggested reply draft (not sent — a human reviews and sends it)
  suggestReply: async (id) => {
    const response = await api.post(`/tickets/${id}/suggest-reply`);
    return response.data; // { draft }
  },
};

export const routingRuleAPI = {
  // List all routing rules
  getRules: async () => {
    const response = await api.get('/routing-rules');
    return response.data;
  },

  // Create a routing rule
  createRule: async (rule) => {
    const response = await api.post('/routing-rules', rule);
    return response.data;
  },

  // Update a routing rule (e.g. change the assigned team)
  updateRule: async (id, updates) => {
    const response = await api.patch(`/routing-rules/${id}`, updates);
    return response.data;
  },

  // Delete a routing rule
  deleteRule: async (id) => {
    const response = await api.delete(`/routing-rules/${id}`);
    return response.data;
  },

  // Seed the 4 default rules (only if none exist yet)
  seedDefaults: async () => {
    const response = await api.post('/routing-rules/seed-defaults');
    return response.data;
  },
};

export const userAPI = {
  // List all users (admin only)
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Create a user (admin only)
  createUser: async (user) => {
    const response = await api.post('/users', user);
    return response.data;
  },

  // Update a user: name / role / active / password (admin only)
  updateUser: async (id, updates) => {
    const response = await api.patch(`/users/${id}`, updates);
    return response.data;
  },

  // Delete a user (admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const settingsAPI = {
  // Get signature + reply templates
  get: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update signature and/or templates
  update: async (updates) => {
    const response = await api.patch('/settings', updates);
    return response.data;
  },
};

export const setupAPI = {
  // Forwarding address + inbound connection status (for the Einrichtung guide)
  info: async () => {
    const response = await api.get('/setup/info');
    return response.data;
  },
};
