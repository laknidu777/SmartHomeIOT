'use client';

import { useEffect, useState } from 'react';
import {
  Table, Modal, Button, Form, Input, Select, Tag, message, Space,
} from 'antd';
import axios from '@/lib/api';
import { useHome } from '@/app/context/HomeContext'; // ✅ context import

const { Option } = Select;

export default function UsersPage() {
  const { homeId, homeName } = useHome();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [devicesByRoom, setDevicesByRoom] = useState({});
  const [form] = Form.useForm();
  const [addUserVisible, setAddUserVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!homeId) return;
    fetchUsers();
    fetchRoomsAndDevices();
  }, [homeId]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/user-assign/homes/${homeId}/assign-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      message.error('Failed to load users');
    }
  };

  const fetchRoomsAndDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const roomRes = await axios.get(`/rooms/${homeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const roomsData = roomRes.data || [];
      setRooms(roomsData);

      const deviceMap = {};
      for (const room of roomsData) {
        const devRes = await axios.get(`/devices/${room.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        deviceMap[room.id] = devRes.data || [];
      }

      setDevicesByRoom(deviceMap);
    } catch (err) {
      message.error('Failed to load rooms or devices');
    }
  };

  const handleAssignUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/user-assign/homes/${homeId}/assign-user`, { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('User assigned');
      setEmail('');
      setAddUserVisible(false);
      fetchUsers();
    } catch (err) {
      message.error('Failed to assign user');
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/homes/${homeId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('User removed');
      fetchUsers();
    } catch (err) {
      message.error('Failed to remove user');
    }
  };

  const columns = [
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', dataIndex: 'role' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button danger size="small" onClick={() => handleRemoveUser(record.id)}>
            Remove
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Users for: <Tag color="blue">{homeName}</Tag></h2>
      <Button type="primary" onClick={() => setAddUserVisible(true)} style={{ marginBottom: 16 }}>
        Assign New User
      </Button>

      <Table rowKey="id" dataSource={users} columns={columns} />

      <Modal
        title="Assign Existing User by Email"
        open={addUserVisible}
        onCancel={() => setAddUserVisible(false)}
        onOk={handleAssignUser}
        okText="Assign"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Modal>

      <div style={{ marginTop: 48 }}>
        <h3 style={{ marginBottom: 16 }}>Rooms & Devices</h3>

        {rooms.length === 0 ? (
          <p>No rooms found for this home.</p>
        ) : (
          rooms.map(room => (
            <div key={room.id} style={{ marginBottom: 32 }}>
              <h4 style={{ color: '#1890ff' }}>{room.name}</h4>
              {devicesByRoom[room.id]?.length > 0 ? (
                <ul>
                  {devicesByRoom[room.id].map(device => (
                    <li key={device.id}>
                      <strong>{device.name}</strong> — <em>{device.type}</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#999' }}>No devices in this room</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
