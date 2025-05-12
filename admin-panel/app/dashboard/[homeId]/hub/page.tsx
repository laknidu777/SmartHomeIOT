// /app/hubs/page.js
'use client';

import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Tabs, message, Tag, Popconfirm, Space, Typography, Select
} from 'antd';
import {
  WifiOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UsbOutlined
} from '@ant-design/icons';
import axios from '@/lib/api';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function HubsPage() {
  const [hubs, setHubs] = useState([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [unassignedDevices, setUnassignedDevices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const homeId = localStorage.getItem('selectedHomeId');
      const headers = { Authorization: `Bearer ${token}` };

      const hubsRes = await axios.get(`/hubs/${homeId}`, { headers });
      setHubs(hubsRes.data);

      const assignedRes = await axios.get(`/devices/assigned/${homeId}`, { headers });
      setAssignedDevices(assignedRes.data);

      const unassignedRes = await axios.get(`/devices/unassigned/${homeId}`, { headers });
      setUnassignedDevices(unassignedRes.data);
    } catch (err) {
      message.error('Failed to load hub data');
    } finally {
      setLoading(false);
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
      fetchAll();
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
      />

      <Tabs defaultActiveKey="assigned">
        <TabPane tab="Assigned Devices" key="assigned">
          <Table
            rowKey="id"
            dataSource={assignedDevices}
            columns={[
              { title: 'Device Name', dataIndex: 'name' },
              { title: 'Hub ID', dataIndex: 'assignedHubId' },
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
        <TabPane tab="Unassigned Devices" key="unassigned">
          <Table
            rowKey="id"
            dataSource={unassignedDevices}
            columns={[
              { title: 'Device Name', dataIndex: 'name' },
              {
                title: 'Assign To',
                render: (_, record) => (
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Hub"
                    onChange={(value) => handleAssign(record.id, value)}
                  >
                    {hubs.map((hub) => (
                      <Select.Option key={hub.espId} value={hub.espId}>
                        <UsbOutlined style={{ marginRight: 6 }} />{hub.name} ({hub.ssid})
                      </Select.Option>
                    ))}
                  </Select>
                ),
              },
            ]}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={editMode ? 'Edit Hub' : 'Add Hub'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
      >
         <Form form={form} layout="vertical" onFinish={handleSaveHub}>
          <Form.Item name="espId" label="Hub ID" rules={[{ required: true, message: 'Hub ID is required' }]}>
            <Input disabled={editMode} />
          </Form.Item>
          <Form.Item name="name" label="Hub Name" rules={[{ required: true, message: 'Hub name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ssid" label="SSID" rules={[{ required: true, message: 'SSID is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password is required' }]}>
            <Input.Password />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            style={{ backgroundColor: '#2B6873', borderColor: '#2B6873' }}
          >
            {editMode ? 'Update Hub' : 'Create Hub'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
