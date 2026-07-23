import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/demo.css';

const DemoPage = () => {
  const navigate = useNavigate();

  const demoTickets = [
    {
      _id: '1',
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      subject: 'Room temperature too cold',
      category: 'complaint',
      priority: 'high',
      status: 'open',
    },
    {
      _id: '2',
      guestName: 'Sarah Smith',
      guestEmail: 'sarah@example.com',
      subject: 'Restaurant reservation request',
      category: 'booking',
      priority: 'medium',
      status: 'in_progress',
    },
    {
      _id: '3',
      guestName: 'Michael Chen',
      guestEmail: 'michael@example.com',
      subject: 'WiFi password needed',
      category: 'inquiry',
      priority: 'low',
      status: 'closed',
    },
  ];

  const statusCounts = {
    all: demoTickets.length,
    open: demoTickets.filter(t => t.status === 'open').length,
    in_progress: demoTickets.filter(t => t.status === 'in_progress').length,
    closed: demoTickets.filter(t => t.status === 'closed').length,
  };

  return (
    <div className="container">
      <div className="demoHeader">
        <h1>🏨 HotelFlow - Demo Mode</h1>
        <p>Experience the dashboard with sample data</p>
      </div>

      <div className="stats">
        <div className="statTile">
          <div className="statNumber">{statusCounts.all}</div>
          <div className="statLabel">Total Tickets</div>
        </div>
        <div className="statTile" style={{ borderTopColor: '#0066cc' }}>
          <div className="statNumber">{statusCounts.open}</div>
          <div className="statLabel">Open</div>
        </div>
        <div className="statTile" style={{ borderTopColor: '#ff9800' }}>
          <div className="statNumber">{statusCounts.in_progress}</div>
          <div className="statLabel">In Progress</div>
        </div>
        <div className="statTile" style={{ borderTopColor: '#4caf50' }}>
          <div className="statNumber">{statusCounts.closed}</div>
          <div className="statLabel">Closed</div>
        </div>
      </div>

      <div className="tableWrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {demoTickets.map(ticket => (
              <tr key={ticket._id}>
                <td>
                  <div className="guestCell">
                    <div className="guestName">{ticket.guestName}</div>
                    <div className="guestEmail">{ticket.guestEmail}</div>
                  </div>
                </td>
                <td>{ticket.subject}</td>
                <td>
                  <span className={`badge ${ticket.category}`}>
                    {ticket.category}
                  </span>
                </td>
                <td>
                  <span className={`badge priority-${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td>{ticket.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="demoFooter">
        <button onClick={() => navigate('/login')} className="demoButton">
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default DemoPage;
