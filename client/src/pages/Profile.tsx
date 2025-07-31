import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    global_prefix: user?.global_prefix || '!',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (formData.new_password && !formData.current_password) {
      toast.error('Current password is required to set a new password');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name,
        global_prefix: formData.global_prefix
      };
      
      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }
      
      await axios.put('/api/auth/profile', updateData);
      toast.success('Profile updated successfully');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h1 className="h3 mb-0">⚙️ Profile Settings</h1>
        <p className="text-muted">Manage your account settings and preferences</p>
      </div>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Account Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={user?.email || ''}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Email cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Global Command Prefix</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.global_prefix}
                        onChange={(e) => handleChange('global_prefix', e.target.value)}
                        maxLength={10}
                      />
                      <Form.Text className="text-muted">
                        Default prefix for bot commands
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={user?.role || ''}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <h6 className="mb-3">Change Password</h6>
                
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={formData.current_password}
                        onChange={(e) => handleChange('current_password', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={formData.new_password}
                        onChange={(e) => handleChange('new_password', e.target.value)}
                        minLength={6}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => handleChange('confirm_password', e.target.value)}
                        minLength={6}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner me-2"></span>
                        Updating...
                      </>
                    ) : (
                      '💾 Save Changes'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Account Statistics</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Group Limit:</span>
                <span className="fw-bold">{user?.group_limit || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Role:</span>
                <span className="badge bg-primary">{user?.role}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Member Since:</span>
                <span>{user ? new Date().toLocaleDateString() : '-'}</span>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Help & Support</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted small">
                Need help with your WhatsApp bot? Check out our documentation or contact support.
              </p>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" size="sm">
                  📚 Documentation
                </Button>
                <Button variant="outline-secondary" size="sm">
                  💬 Contact Support
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;