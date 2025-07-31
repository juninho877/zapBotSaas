import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Session {
  id: number;
  session_id: string;
  status: string;
  phone_number?: string;
  profile_name?: string;
  qr_code?: string;
  user_name?: string;
  last_activity: string;
  created_at: string;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ show: boolean; qrCode: string }>({
    show: false,
    qrCode: ''
  });

  useEffect(() => {
    fetchSessions();
    
    // Listen for session updates
    const handleSessionUpdate = (event: any) => {
      fetchSessions();
    };
    
    window.addEventListener('sessionUpdate', handleSessionUpdate);
    return () => window.removeEventListener('sessionUpdate', handleSessionUpdate);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/sessions');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      setLoading(true);
      await axios.post('/api/sessions');
      toast.success('Session created successfully');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const disconnectSession = async (id: number) => {
    try {
      await axios.post(`/api/sessions/${id}/disconnect`);
      toast.success('Session disconnected');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disconnect session');
    }
  };

  const deleteSession = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await axios.delete(`/api/sessions/${id}`);
      toast.success('Session deleted');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete session');
    }
  };

  const showQrCode = (qrCode: string) => {
    setQrModal({ show: true, qrCode });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      connected: { variant: 'success', text: 'Connected' },
      connecting: { variant: 'warning', text: 'Connecting' },
      disconnected: { variant: 'secondary', text: 'Disconnected' },
      error: { variant: 'danger', text: 'Error' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.error;
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="loading-spinner me-2"></div>
        <span>Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">📱 WhatsApp Sessions</h1>
        <Button variant="primary" onClick={createSession} disabled={loading}>
          + Create New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="display-1 mb-3">📱</div>
            <h4>No Sessions Found</h4>
            <p className="text-muted mb-4">
              Create your first WhatsApp session to start managing groups and commands.
            </p>
            <Button variant="primary" onClick={createSession}>
              Create Your First Session
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {sessions.map((session) => (
            <Col lg={6} key={session.id}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">{session.profile_name || 'WhatsApp Session'}</h6>
                    {session.user_name && (
                      <small className="text-muted">Owner: {session.user_name}</small>
                    )}
                  </div>
                  {getStatusBadge(session.status)}
                </Card.Header>
                
                <Card.Body>
                  <div className="mb-3">
                    <small className="text-muted">Session ID:</small>
                    <div className="font-monospace small">{session.session_id}</div>
                  </div>

                  {session.phone_number && (
                    <div className="mb-3">
                      <small className="text-muted">Phone Number:</small>
                      <div>{session.phone_number}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <small className="text-muted">Last Activity:</small>
                    <div>{new Date(session.last_activity).toLocaleString()}</div>
                  </div>

                  {session.qr_code && session.status === 'connecting' && (
                    <div className="text-center mb-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => showQrCode(session.qr_code!)}
                      >
                        📱 Show QR Code
                      </Button>
                      <div className="small text-muted mt-1">
                        Scan with WhatsApp to connect
                      </div>
                    </div>
                  )}
                </Card.Body>

                <Card.Footer className="d-flex gap-2">
                  {session.status === 'connected' && (
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => disconnectSession(session.id)}
                    >
                      Disconnect
                    </Button>
                  )}
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                  >
                    Delete
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* QR Code Modal */}
      <Modal 
        show={qrModal.show} 
        onHide={() => setQrModal({ show: false, qrCode: '' })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Scan QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Open WhatsApp on your phone and scan this QR code:</p>
          {qrModal.qrCode && (
            <img 
              src={qrModal.qrCode} 
              alt="QR Code" 
              className="img-fluid"
              style={{ maxWidth: '300px' }}
            />
          )}
          <div className="mt-3">
            <small className="text-muted">
              Go to Settings &gt; Linked Devices &gt; Link a Device
            </small>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Sessions;