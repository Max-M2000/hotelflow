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
};
