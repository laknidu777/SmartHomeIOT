// /app/hubs/page.js
'use client';

import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Tabs, message, Tag, Popconfirm, Space, Typography, Select
} from 'antd';
import axios from '@/lib/api';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function HubsPage() {
  const [hubs, setHubs] = useState<{ espId: string; name: string; ssid: string }[]>([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [unassignedDevices, setUnassignedDevices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHub, setSelectedHub] = useState<{ id: string; espId: string; name: string; ssid: string; password: string } | null>(null); 
  //const [selectedHub, setSelectedHub] = useState<{ espId: string; name: string; ssid: string; password: string } | null>(null);
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

  const isHubOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const secondsAgo = (Date.now() - new Date(lastSeen).getTime()) / 1000;
    return secondsAgo < 65;
  };

  const handleSaveHub = async (values: { name: string; espId: string; ssid: string; password: string }) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const homeId = localStorage.getItem('selectedHomeId');

    const payload = {
      ...values,
      houseId: homeId,
    };

    //console.log('🚀 Submitting hub payload:', payload);

    if (editMode) {
      await axios.patch(`/hubs/${selectedHub?.id}`, payload, { headers });
      message.success('Hub updated');
    } else {
      await axios.post('/hubs/create', payload, { headers }); // ✅ use POST
      message.success('Hub added');
    }

    form.resetFields();
    setModalVisible(false);
    fetchAll();
  } catch (err) {
    //console.error('❌ Hub error:', err.response?.data || err.message);
    message.error('Failed to save hub');
  }
};


  const handleDeleteHub = async (hubId: string) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`/hubs/${hubId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    message.success('Hub deleted');
    fetchAll();
  } catch (err) {
    message.error('Failed to delete hub');
  }
};


  const handleAssign = async (deviceId: string, hubId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/devices/${deviceId}/assign-hub`, { hubId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Device assigned');
      fetchAll();
    } catch (err) {
      message.error('Failed to assign device');
    }
  };

  const handleUnassign = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/devices/${deviceId}/unassign-hub`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Device unassigned');
      fetchAll();
    } catch (err) {
      message.error('Failed to unassign device');
    }
  };

  const hubColumns = [
    {
      title: 'Hub Name',
      dataIndex: 'name',
    },
    {
      title: 'SSID',
      dataIndex: 'ssid',
    },
    {
      title: 'Online',
      render: (_: any, record: any) => (
        <Tag color={isHubOnline(record.lastSeen) ? 'green' : 'red'}>
          {isHubOnline(record.lastSeen) ? 'Online' : 'Offline'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_: any, record: { id: string; name: string; ssid?: string; password?: string; assignedHubId?: string }) => (
        <Space>
          <Button onClick={() => {
            setSelectedHub({
              id: record.id,
              espId: record.espId,
              name: record.name,
              ssid: record.ssid || '',
              password: record.password || '',
            });
            form.setFieldsValue({
              espId: record.id,
              name: record.name,
              ssid: record.ssid,
              password: record.password,
            });
            setEditMode(true);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>Edit</Button>
          <Popconfirm
            title="Delete this hub?"
            onConfirm={() => handleDeleteHub(record.id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Manage Hubs</Title>
      <Button type="primary" onClick={() => {
        setModalVisible(true);
        setEditMode(false);
        form.resetFields();
      }} style={{ marginBottom: 16 }}>
        Add Hub
      </Button>

      <Table
        rowKey="id"
        columns={hubColumns}
        dataSource={hubs}
        pagination={false}
        style={{ marginBottom: 32 }}
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
                render: (_: any, record: { id: string }) => (
                  <Button danger onClick={() => handleUnassign(record.id)}>
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
                render: (_: any, record: { id: string; name: string }) => (
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Hub"
                    onChange={(value) => handleAssign(record.id, value)}
                  >
                    {hubs.map((hub) => (
                      <Select.Option key={hub.espId} value={hub.espId}>
                        {hub.name} ({hub.ssid})
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
      >
        <Form layout="vertical" form={form} onFinish={handleSaveHub}>
          <Form.Item name="espId" label="Hub ID" rules={[{ required: true }]}>
            <Input disabled={editMode} />
          </Form.Item>
          <Form.Item name="name" label="Hub Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ssid" label="SSID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editMode ? 'Update Hub' : 'Create Hub'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
