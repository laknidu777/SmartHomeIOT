'use client';

import { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Descriptions,
  Button,
  Popconfirm,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/api';
import { useRoleGuard } from '../../../hooks/useRoleGuard';

const { Title } = Typography;

export default function ProfilePage() {
  useRoleGuard(['SuperAdmin']);
  const { homeId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [home, setHome] = useState(null);
  const [role, setRole] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUser();
    fetchCurrentHome();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      message.error('Failed to fetch user');
    }
  };

  const fetchCurrentHome = async () => {
    try {
      const res = await axios.get(`/houses/${homeId}`); // returns home + user's role
      setHome(res.data.house);
      setRole(res.data.role); // assuming backend returns role too
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch home');
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`/houses/${homeId}`, values);
      message.success('Home updated');
      fetchCurrentHome();
      setEditing(false);
    } catch (err) {
      message.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/houses/${homeId}`);
      message.success('Home deleted');
      router.push('/login');
    } catch (err) {
      message.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>User Profile</Title>

      <Card style={{ marginBottom: 32 }}>
        {user ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Full Name">{user.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
          </Descriptions>
        ) : (
          <p>Loading user info...</p>
        )}
      </Card>

      <Title level={3}>Current Home</Title>
      {home ? (
        <Card>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Home Name">{home.name}</Descriptions.Item>
            <Descriptions.Item label="Address">{home.address}</Descriptions.Item>
            <Descriptions.Item label="Role">{role}</Descriptions.Item>
          </Descriptions>

          {(role === 'Admin' || role === 'SuperAdmin') && (
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => {
                setEditing(true);
                form.setFieldsValue(home);
              }}>
                Edit Home
              </Button>
              <Popconfirm
                title="Are you sure to delete this home?"
                onConfirm={handleDelete}
              >
                <Button danger style={{ marginLeft: 12 }}>
                  Delete Home
                </Button>
              </Popconfirm>
            </div>
          )}
        </Card>
      ) : (
        <p>Loading home info...</p>
      )}

      <Modal
        title="Edit Home"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={handleUpdate}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Home Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
