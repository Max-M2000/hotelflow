import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../services/api';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketAPI.getTickets();
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updated = await ticketAPI.updateTicket(ticketId, { status: newStatus });
      setTickets(tickets.map(t => t._id === ticketId ? updated : t));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>HotelFlow Dashboard</h1>
      <p>Total tickets: {tickets.length}</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Guest</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Subject</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Priority</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{ticket.guestName}</td>
              <td style={{ padding: '10px' }}>{ticket.subject}</td>
              <td style={{ padding: '10px' }}>{ticket.category}</td>
              <td style={{ padding: '10px' }}>{ticket.priority}</td>
              <td style={{ padding: '10px' }}>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                <a href={`/ticket/${ticket._id}`}>View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
