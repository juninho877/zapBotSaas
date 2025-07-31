import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, Row, Col, Button } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface LogEntry {
  id: number;
  action: string;
  details: string;
  user_jid?: string;
  message_id?: string;
  group_name?: string;
  session_identifier?: string;
  user_name?: string;
  created_at: string;
}

const Logs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    userId: user?.role === 'admin' ? '' : user?.id?.toString() || '',
    action: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      let url = '/api/logs';
      
      if (filter.userId) {
        url += `/user/${filter.userId}`;
      }
      
      const params = new URLSearchParams({
        page: filter.page.toString(),
        limit: filter.limit.toString()
      });
      
      const response = await axios.get(`${url}?${params}`);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionMap: { [key: string]: { variant: string; text: string } } = {
      user_login: { variant: 'success', text: 'Login' },
      user_created: { variant: 'info', text: 'User Created' },
      session_created: { variant: 'primary', text: 'Session Created' },
      session_disconnected: { variant: 'warning', text: 'Session Disconnected' },
      message_received: { variant: 'secondary', text: 'Message' },
      command_executed: { variant: 'info', text: 'Command' },
      action_delete: { variant: 'danger', text: 'Delete' },
      action_warn: { variant: 'warning', text: 'Warn' },
      action_mute: { variant: 'warning', text: 'Mute' },
      action_ban: { variant: 'danger', text: 'Ban' },
      group_config_updated: { variant: 'primary', text: 'Config Updated' },
      user_banned: { variant: 'danger', text: 'User Banned' },
      message_deleted: { variant: 'warning', text: 'Message Deleted' }
    };

    const actionInfo = actionMap[action] || { variant: 'secondary', text: action };
    return <Badge bg={actionInfo.variant}>{actionInfo.text}</Badge>;
  };

  const formatDetails = (details: string) => {
    if (details.length > 100) {
      return details.substring(0, 100) + '...';
    }
    return details;
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilter(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="loading-spinner me-2"></div>
        <span>Loading logs...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">📋 Activity Logs</h1>
        <Button variant="outline-primary" onClick={fetchLogs}>
          🔄 Refresh
        </Button>
      </div>

      {/* Filters */}
      {user?.role === 'admin' && (
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Filters</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={filter.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    placeholder="All users"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Action</Form.Label>
                  <Form.Select
                    value={filter.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <option value="">All actions</option>
                    <option value="user_login">Login</option>
                    <option value="session_created">Session Created</option>
                    <option value="command_executed">Command Executed</option>
                    <option value="message_received">Message Received</option>
                    <option value="group_config_updated">Config Updated</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Items per page</Form.Label>
                  <Form.Select
                    value={filter.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Recent Activity ({logs.length} entries)</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 mb-3">📋</div>
              <h4>No Logs Found</h4>
              <p className="text-muted">No activity logs match your current filters.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Details</th>
                  {user?.role === 'admin' && <th>User</th>}
                  <th>Group</th>
                  <th>Session</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small>
                        {new Date(log.created_at).toLocaleString()}
                      </small>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '300px' }}>
                        {formatDetails(log.details)}
                      </div>
                      {log.user_jid && (
                        <small className="text-muted d-block">
                          User: {log.user_jid.split('@')[0]}
                        </small>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td>
                        <small>{log.user_name || 'System'}</small>
                      </td>
                    )}
                    <td>
                      <small>{log.group_name || '-'}</small>
                    </td>
                    <td>
                      <small className="font-monospace">
                        {log.session_identifier ? 
                          log.session_identifier.split('_')[2]?.substring(0, 8) + '...' : 
                          '-'
                        }
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Logs;