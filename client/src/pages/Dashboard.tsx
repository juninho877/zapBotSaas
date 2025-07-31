import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

interface DashboardStats {
  total_users: number;
  total_sessions: number;
  active_sessions: number;
  total_groups: number;
  websocket_connections: number;
  uptime: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const chartData = stats ? [
    { name: 'Users', value: stats.total_users },
    { name: 'Sessions', value: stats.total_sessions },
    { name: 'Active', value: stats.active_sessions },
    { name: 'Groups', value: stats.total_groups },
  ] : [];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="loading-spinner me-2"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">📊 Dashboard</h1>
        <small className="text-muted">
          Uptime: {stats ? formatUptime(stats.uptime) : 'N/A'}
        </small>
      </div>

      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-2">👥</div>
              <h5 className="card-title">Total Users</h5>
              <h2 className="text-primary">{stats?.total_users || 0}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-2">📱</div>
              <h5 className="card-title">Active Sessions</h5>
              <h2 className="text-success">{stats?.active_sessions || 0}</h2>
              <small className="text-muted">
                of {stats?.total_sessions || 0} total
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="display-4 text-info mb-2">💬</div>
              <h5 className="card-title">Total Groups</h5>
              <h2 className="text-info">{stats?.total_groups || 0}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="display-4 text-warning mb-2">🔌</div>
              <h5 className="card-title">Live Connections</h5>
              <h2 className="text-warning">{stats?.websocket_connections || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📈 System Overview</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">⚡ System Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Database</span>
                <span className="badge bg-success">Connected</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>WhatsApp Service</span>
                <span className="badge bg-success">Running</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>WebSocket</span>
                <span className="badge bg-success">Active</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Session Health</span>
                <span className="badge bg-warning">
                  {stats?.active_sessions || 0}/{stats?.total_sessions || 0}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;