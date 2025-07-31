import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h4>🤖 WhatsApp Bot SaaS</h4>
        <small>Multi-tenant Bot Platform</small>
      </div>
      
      <Nav className="flex-column px-3 py-2">
        <LinkContainer to="/dashboard">
          <Nav.Link>📊 Dashboard</Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/sessions">
          <Nav.Link>📱 Sessions</Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/groups">
          <Nav.Link>👥 Groups</Nav.Link>
        </LinkContainer>
        
        {user?.role === 'admin' && (
          <LinkContainer to="/users">
            <Nav.Link>👤 Users</Nav.Link>
          </LinkContainer>
        )}
        
        <LinkContainer to="/logs">
          <Nav.Link>📋 Logs</Nav.Link>
        </LinkContainer>
        
        <hr className="my-3" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <LinkContainer to="/profile">
          <Nav.Link>⚙️ Profile</Nav.Link>
        </LinkContainer>
      </Nav>
    </div>
  );
};

export default Sidebar;