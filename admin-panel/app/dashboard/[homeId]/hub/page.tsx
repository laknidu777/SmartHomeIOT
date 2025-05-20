// /app/hubs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Tabs, message, Tag, Popconfirm, Space, Typography
} from 'antd';
import {
  WifiOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UsbOutlined
} from '@ant-design/icons';
import axios from '@/lib/api';
import { useRoleGuard } from '../../../hooks/useRoleGuard';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function HubsPage() {
  useRoleGuard(['SuperAdmin']);
  const [hubs, setHubs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [hubDeviceMap, setHubDeviceMap] = useState({});

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const homeId = localStorage.getItem('selectedHomeId');
      const headers = { Authorization: `Bearer ${token}` };

      const hubsRes = await axios.get(`/hubs/${homeId}`, { headers });
      setHubs(hubsRes.data);
    } catch (err) {
      message.error('Failed to load hub data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevicesForHub = async (espId) => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.get(`/devices/hub/${espId}/assignment-overview`, { headers });
      setHubDeviceMap(prev => ({ ...prev, [espId]: res.data }));
    } catch (err) {
      message.error(`Failed to fetch devices for hub ${espId}`);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const isHubOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const secondsAgo = (Date.now() - new Date(lastSeen).getTime()) / 1000;
    return secondsAgo < 65;
  };

  const handleSaveHub = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const homeId = localStorage.getItem('selectedHomeId');

      const payload = { ...values, houseId: homeId };

      if (editMode) {
        await axios.patch(`/hubs/${selectedHub?.id}`, payload, { headers });
        message.success('Hub updated');
      } else {
        await axios.post('/hubs/create', payload, { headers });
        message.success('Hub added');
      }

      form.resetFields();
      setModalVisible(false);
      fetchAll();
    } catch {
      message.error('Failed to save hub');
    }
  };

  const handleDeleteHub = async (hubId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/hubs/${hubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Hub deleted');
      fetchAll();
    } catch {
      message.error('Failed to delete hub');
    }
  };

  const handleAssign = async (deviceId, hubId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/devices/${deviceId}/assign-hub`, { hubId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Device assigned');
      fetchDevicesForHub(hubId);
    } catch {
      message.error('Failed to assign device');
    }
  };

  const handleUnassign = async (deviceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/devices/${deviceId}/unassign-hub`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Device unassigned');
      fetchAll();
    } catch {
      message.error('Failed to unassign device');
    }
  };

  const hubColumns = [
    {
      title: 'Hub Name',
      dataIndex: 'name',
      render: (name) => (
        <span><WifiOutlined style={{ marginRight: 6, color: '#2B6873' }} />{name}</span>
      ),
    },
    {
      title: 'SSID',
      dataIndex: 'ssid',
    },
    {
      title: 'Online',
      render: (_, record) => (
        <Tag color={isHubOnline(record.lastSeen) ? 'green' : 'red'}>
          {isHubOnline(record.lastSeen) ? 'Online' : 'Offline'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => {
            setSelectedHub({
              id: record.id,
              espId: record.espId,
              name: record.name,
              ssid: record.ssid || '',
              password: record.password || '',
            });
            form.setFieldsValue({
              espId: record.espId || '',
              name: record.name || '',
              ssid: record.ssid || '',
              password: record.password || '',
            });
            setEditMode(true);
            setModalVisible(true);
          }}>Edit</Button>
          <Popconfirm
            title="Delete this hub?"
            onConfirm={() => handleDeleteHub(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '40px 24px', background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#2B6873' }}>Manage Hubs</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setModalVisible(true);
        setEditMode(false);
        setSelectedHub(null);
        form.resetFields();
      }} style={{ marginBottom: 16, backgroundColor: '#2B6873', borderColor: '#2B6873' }}>
        Add Hub
      </Button>

      <Table
        rowKey="id"
        columns={hubColumns}
        dataSource={hubs}
        pagination={false}
        style={{ marginBottom: 32, backgroundColor: 'white', borderRadius: 12 }}
        loading={loading}
        expandable={{
          expandedRowRender: (hub) => {
            const data = hubDeviceMap[hub.espId] || { assignedDevices: [], unassignedDevices: [] };

            return (
              <Tabs defaultActiveKey="1">
                <TabPane tab="Assigned Devices" key="1">
                  <Table
                    rowKey="id"
                    dataSource={data.assignedDevices}
                    pagination={false}
                    columns={[
                      { title: 'Device Name', dataIndex: 'name' },
                      {
                        title: 'Actions',
                        render: (_, record) => (
                          <Button danger icon={<DeleteOutlined />} onClick={() => handleUnassign(record.id)}>
                            Unassign
                          </Button>
                        ),
                      },
                    ]}
                  />
                </TabPane>
                <TabPane tab="Unassigned Devices" key="2">
                  <Table
                    rowKey="id"
                    dataSource={data.unassignedDevices}
                    pagination={false}
                    columns={[
                      { title: 'Device Name', dataIndex: 'name' },
                      {
                        title: 'Assign To This Hub',
                        render: (_, record) => (
                          <Button icon={<UsbOutlined />} type="primary" onClick={() => handleAssign(record.id, hub.espId)}>
                            Assign
                          </Button>
                        ),
                      },
                    ]}
                  />
                </TabPane>
              </Tabs>
            );
          },
          onExpand: (expanded, hub) => {
            if (expanded) fetchDevicesForHub(hub.espId);
          },
        }}
      />

      <Modal
        title={editMode ? 'Edit Hub' : 'Add Hub'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSaveHub}>
          <Form.Item name="espId" label="Hub ID" rules={[{ required: true, message: 'Hub ID is required' }]}> <Input disabled={editMode} /></Form.Item>
          <Form.Item name="name" label="Hub Name" rules={[{ required: true, message: 'Hub name is required' }]}> <Input /></Form.Item>
          <Form.Item name="ssid" label="SSID" rules={[{ required: true, message: 'SSID is required' }]}> <Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password is required' }]}> <Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit" block style={{ backgroundColor: '#2B6873', borderColor: '#2B6873' }}>
            {editMode ? 'Update Hub' : 'Create Hub'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}