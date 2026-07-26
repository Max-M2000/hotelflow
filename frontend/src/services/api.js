import axios from 'axios';

const API_BASE_URL = 'https://hotelflow-production-738f.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
