import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Table } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Group {
  id: number;
  group_name: string;
  group_jid: string;
  is_active: boolean;
  session_status: string;
  session_identifier: string;
  user_name?: string;
  joined_at: string;
}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
    
    // Listen for group updates
    const handleGroupUpdate = (event: any) => {
      fetchGroups();
    };
    
    window.addEventListener('groupUpdate', handleGroupUpdate);
    return () => window.removeEventListener('groupUpdate', handleGroupUpdate);
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.put(`/api/groups/${id}`, { is_active: !currentStatus });
      toast.success(`Group ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update group');
    }
  };

  const deleteGroup = async (id: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/groups/${id}`);
      toast.success('Group deleted');
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const getSessionStatusBadge = (status: string) => {
    const statusMap = {
      connected: { variant: 'success', text: 'Connected' },
      connecting: { variant: 'warning', text: 'Connecting' },
      disconnected: { variant: 'secondary', text: 'Disconnected' },
      error: { variant: 'danger', text: 'Error' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.error;
    return <Badge bg={statusInfo.variant} className="me-2">{statusInfo.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="loading-spinner me-2"></div>
        <span>Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">👥 WhatsApp Groups</h1>
        <div className="text-muted">
          {groups.length} groups found
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="display-1 mb-3">👥</div>
            <h4>No Groups Found</h4>
            <p className="text-muted mb-4">
              Connect a WhatsApp session first, then your groups will appear here automatically.
            </p>
            <LinkContainer to="/sessions">
              <Button variant="primary">Manage Sessions</Button>
            </LinkContainer>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Groups Overview</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <div className="fw-medium">{group.group_name}</div>
                      <small className="text-muted font-monospace">
                        {group.group_jid}
                      </small>
                    </td>
                    <td>
                      <div>
                        {getSessionStatusBadge(group.session_status)}
                        <small className="text-muted">
                          {group.session_identifier}
                        </small>
                      </div>
                      {group.user_name && (
                        <small className="text-muted d-block">
                          Owner: {group.user_name}
                        </small>
                      )}
                    </td>
                    <td>
                      <Badge bg={group.is_active ? 'success' : 'secondary'}>
                        {group.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <small>{new Date(group.joined_at).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <LinkContainer to={`/groups/${group.id}/config`}>
                          <Button variant="outline-primary" size="sm">
                            ⚙️ Config
                          </Button>
                        </LinkContainer>
                        
                        <Button
                          variant={group.is_active ? "outline-warning" : "outline-success"}
                          size="sm"
                          onClick={() => toggleGroupStatus(group.id, group.is_active)}
                        >
                          {group.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteGroup(group.id, group.group_name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Groups;