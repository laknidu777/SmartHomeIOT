// /app/devices/page.js
'use client';

import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, message, Popconfirm, Typography, Space, Spin
} from 'antd';
import axios from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<{ id: string; name: string; espId: string; type: string; roomId: string } | null>(null);
  const [form] = Form.useForm();

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/devices/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data);
    } catch (err) {
      message.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const homeId = localStorage.getItem('selectedHomeId');
      const res = await axios.get(`/rooms/${homeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      message.error('Failed to fetch rooms');
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchRooms();
  }, []);

  const openModal = (device: { id: string; name: string; espId: string; type: string; roomId: string } | null = null) => {
      setEditingDevice(device);
      form.setFieldsValue(device || { name: '', espId: '', type: '', roomId: '' });
      setModalVisible(true);
    };

  const handleSubmit = async (values: { name: string; espId: string; type: string; roomId: string }) => {
    try {
      const token = localStorage.getItem('token');
      if (editingDevice) {
        await axios.patch(`/devices/${editingDevice.id}`, values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Device updated');
      } else {
        await axios.post('/devices', values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Device added');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDevice(null);
      fetchDevices();
    } catch (err) {
      message.error('Failed to save device');
    }
  };

  const handleDelete = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Device deleted');
      fetchDevices();
    } catch (err) {
      message.error('Failed to delete device');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
    },
    {
      title: 'ESP ID',
      dataIndex: 'espId',
    },
    {
      title: 'Room',
      render: (_: any, record: { roomId: string }) => rooms.find(r => r.id === record.roomId)?.name || '—',
    },
    {
      title: 'Actions',
      render: (_: any, record: { id: string; name: string; espId: string; type: string; roomId: string }) => (
        <Space>
          <Button onClick={() => openModal(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this device?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Manage Devices</Title>
      <Button type="primary" onClick={() => openModal()} style={{ marginBottom: 16 }}>
        Add Device
      </Button>

      {loading ? (
        <Spin />
      ) : (
        <Table
          rowKey="id"
          dataSource={devices}
          columns={columns}
          pagination={{ pageSize: 8 }}
        />
      )}

      <Modal
        title={editingDevice ? 'Edit Device' : 'Add Device'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDevice(null);
        }}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="name" label="Device Name" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="espId" label="ESP ID" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="type" label="Device Type" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="roomId" label="Assign to Room" rules={[{ required: true }]}> 
            <Select placeholder="Select a room">
              {rooms.map((room) => (
                <Option key={room.id} value={room.id}>{room.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editingDevice ? 'Update Device' : 'Create Device'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
