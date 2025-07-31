import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Dropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();

  return (
    <BootstrapNavbar bg="white" className="navbar px-4 py-3">
      <div className="d-flex align-items-center">
        <div className="d-flex align-items-center">
          <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-3`}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </span>
        </div>
      </div>
      
      <Nav className="ms-auto">
        <Dropdown align="end">
          <Dropdown.Toggle variant="outline-primary" id="user-dropdown">
            {user?.name}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item href="/profile">Profile</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
    </BootstrapNavbar>
  );
};

export default Navbar;