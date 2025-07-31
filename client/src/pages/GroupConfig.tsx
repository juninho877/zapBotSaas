import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Tabs, Tab, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

interface GroupConfig {
  id: number;
  prefix: string;
  welcome_message: string;
  welcome_image: string;
  rules_message: string;
  anti_link_active: boolean;
  anti_link_action: string;
  anti_profanity_active: boolean;
  anti_profanity_action: string;
  anti_flood_active: boolean;
  anti_flood_limit: number;
  anti_flood_timeframe: number;
  anti_flood_action: string;
  admin_only_mode: boolean;
  prohibited_words: string[];
  whitelist_links: any[];
  auto_responses: any[];
  active_commands: any;
}

interface Group {
  id: number;
  group_name: string;
  group_jid: string;
  is_active: boolean;
}

const GroupConfig: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [config, setConfig] = useState<Partial<GroupConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [prohibitedWords, setProhibitedWords] = useState<string>('');
  const [whitelistLinks, setWhitelistLinks] = useState<string>('');
  const [autoResponses, setAutoResponses] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);

  const fetchGroupData = async () => {
    try {
      const [groupResponse, configResponse] = await Promise.all([
        axios.get(`/api/groups/${id}`),
        axios.get(`/api/groups/${id}/config`)
      ]);

      setGroup(groupResponse.data.group);
      const configData = configResponse.data.config || {};
      setConfig(configData);

      // Convert arrays to strings for form inputs
      setProhibitedWords(
        configData.prohibited_words ? 
        (typeof configData.prohibited_words === 'string' ? 
          JSON.parse(configData.prohibited_words) : 
          configData.prohibited_words
        ).join(', ') : ''
      );

      setWhitelistLinks(
        configData.whitelist_links ? 
        (typeof configData.whitelist_links === 'string' ? 
          JSON.parse(configData.whitelist_links) : 
          configData.whitelist_links
        ).map((link: any) => link.url || link).join(', ') : ''
      );

      setAutoResponses(
        configData.auto_responses ? 
        (typeof configData.auto_responses === 'string' ? 
          JSON.parse(configData.auto_responses) : 
          configData.auto_responses
        ).map((resp: any) => `${resp.keyword}:${resp.response}`).join('\n') : ''
      );

    } catch (error) {
      console.error('Failed to fetch group data:', error);
      toast.error('Failed to load group configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfiguration = async () => {
    if (!id) return;

    setSaving(true);
    try {
      // Prepare data for saving
      const configData = {
        ...config,
        prohibited_words: prohibitedWords ? 
          prohibitedWords.split(',').map(word => word.trim()).filter(Boolean) : [],
        whitelist_links: whitelistLinks ? 
          whitelistLinks.split(',').map(link => ({ url: link.trim(), type: 'contains' })).filter(link => link.url) : [],
        auto_responses: autoResponses ? 
          autoResponses.split('\n').map(line => {
            const [keyword, response] = line.split(':');
            return keyword && response ? { keyword: keyword.trim(), response: response.trim() } : null;
          }).filter(Boolean) : []
      };

      await axios.put(`/api/groups/${id}/config`, configData);
      toast.success('Configuration saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="loading-spinner me-2"></div>
        <span>Loading group configuration...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <Alert variant="danger">
        Group not found or you don't have permission to access it.
      </Alert>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">⚙️ Group Configuration</h1>
          <div className="text-muted">
            {group.group_name}
            <Badge bg={group.is_active ? 'success' : 'secondary'} className="ms-2">
              {group.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={saveConfiguration}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="loading-spinner me-2"></span>
                Saving...
              </>
            ) : (
              '💾 Save Configuration'
            )}
          </Button>
          <Link to="/groups" className="btn btn-outline-secondary">
            ← Back to Groups
          </Link>
        </div>
      </div>

      <Tabs defaultActiveKey="general" className="mb-4">
        <Tab eventKey="general" title="🔧 General">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">General Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Command Prefix</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.prefix || '!'}
                      onChange={(e) => handleConfigChange('prefix', e.target.value)}
                      placeholder="!"
                      maxLength={10}
                    />
                    <Form.Text className="text-muted">
                      Character(s) that trigger bot commands (e.g., !, ., /)
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Welcome Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={config.welcome_message || ''}
                      onChange={(e) => handleConfigChange('welcome_message', e.target.value)}
                      placeholder="Welcome to our group! Please read the rules and enjoy your stay."
                    />
                    <Form.Text className="text-muted">
                      Message sent when new members join the group
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Group Rules</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={config.rules_message || ''}
                      onChange={(e) => handleConfigChange('rules_message', e.target.value)}
                      placeholder="1. Be respectful to all members&#10;2. No spam or self-promotion&#10;3. Stay on topic"
                    />
                    <Form.Text className="text-muted">
                      Rules displayed when users type !rules command
                    </Form.Text>
                  </Form.Group>

                  <Form.Check
                    type="checkbox"
                    label="Admin-Only Mode (Mute Group)"
                    checked={config.admin_only_mode || false}
                    onChange={(e) => handleConfigChange('admin_only_mode', e.target.checked)}
                    className="mb-3"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="antilink" title="🔗 Anti-Link">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Anti-Link Protection</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="checkbox"
                    label="Enable Anti-Link Protection"
                    checked={config.anti_link_active || false}
                    onChange={(e) => handleConfigChange('anti_link_active', e.target.checked)}
                    className="mb-3"
                  />

                  <Form.Group className="mb-3">
                    <Form.Label>Action When Link Detected</Form.Label>
                    <Form.Select
                      value={config.anti_link_action || 'delete'}
                      onChange={(e) => handleConfigChange('anti_link_action', e.target.value)}
                      disabled={!config.anti_link_active}
                    >
                      <option value="delete">Delete Message</option>
                      <option value="warn">Warn User</option>
                      <option value="mute">Mute User</option>
                      <option value="ban">Ban User</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Whitelisted Links</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={whitelistLinks}
                      onChange={(e) => setWhitelistLinks(e.target.value)}
                      placeholder="youtube.com, github.com, example.com"
                      disabled={!config.anti_link_active}
                    />
                    <Form.Text className="text-muted">
                      Comma-separated list of allowed domains/links
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="antiprofanity" title="🚫 Anti-Profanity">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Anti-Profanity Filter</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="checkbox"
                    label="Enable Anti-Profanity Filter"
                    checked={config.anti_profanity_active || false}
                    onChange={(e) => handleConfigChange('anti_profanity_active', e.target.checked)}
                    className="mb-3"
                  />

                  <Form.Group className="mb-3">
                    <Form.Label>Action When Profanity Detected</Form.Label>
                    <Form.Select
                      value={config.anti_profanity_action || 'delete'}
                      onChange={(e) => handleConfigChange('anti_profanity_action', e.target.value)}
                      disabled={!config.anti_profanity_active}
                    >
                      <option value="delete">Delete Message</option>
                      <option value="warn">Warn User</option>
                      <option value="mute">Mute User</option>
                      <option value="ban">Ban User</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Prohibited Words</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={prohibitedWords}
                      onChange={(e) => setProhibitedWords(e.target.value)}
                      placeholder="badword1, badword2, badword3"
                      disabled={!config.anti_profanity_active}
                    />
                    <Form.Text className="text-muted">
                      Comma-separated list of words/phrases to filter
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="antiflood" title="🌊 Anti-Flood">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Anti-Flood Protection</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="checkbox"
                    label="Enable Anti-Flood Protection"
                    checked={config.anti_flood_active || false}
                    onChange={(e) => handleConfigChange('anti_flood_active', e.target.checked)}
                    className="mb-3"
                  />

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Message Limit</Form.Label>
                        <Form.Control
                          type="number"
                          value={config.anti_flood_limit || 5}
                          onChange={(e) => handleConfigChange('anti_flood_limit', parseInt(e.target.value))}
                          min="1"
                          max="50"
                          disabled={!config.anti_flood_active}
                        />
                        <Form.Text className="text-muted">
                          Maximum messages allowed
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Time Frame (seconds)</Form.Label>
                        <Form.Control
                          type="number"
                          value={config.anti_flood_timeframe || 60}
                          onChange={(e) => handleConfigChange('anti_flood_timeframe', parseInt(e.target.value))}
                          min="10"
                          max="300"
                          disabled={!config.anti_flood_active}
                        />
                        <Form.Text className="text-muted">
                          Time window for message counting
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Action When Flood Detected</Form.Label>
                    <Form.Select
                      value={config.anti_flood_action || 'warn'}
                      onChange={(e) => handleConfigChange('anti_flood_action', e.target.value)}
                      disabled={!config.anti_flood_active}
                    >
                      <option value="delete">Delete Messages</option>
                      <option value="warn">Warn User</option>
                      <option value="mute">Mute User</option>
                      <option value="ban">Ban User</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="autoresponse" title="🤖 Auto-Response">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Auto-Response System</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Auto Responses</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={8}
                      value={autoResponses}
                      onChange={(e) => setAutoResponses(e.target.value)}
                      placeholder="hello:Hello! Welcome to our group!&#10;help:Type !menu to see available commands&#10;contact:For support, contact admin@example.com"
                    />
                    <Form.Text className="text-muted">
                      Format: keyword:response (one per line)<br/>
                      Bot will respond when someone types the keyword
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default GroupConfig;