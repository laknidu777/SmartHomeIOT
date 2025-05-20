'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
} from 'antd';
import {
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import axios from '@/lib/api';
import { useRoleGuard } from '../../../hooks/useRoleGuard';

const { Title } = Typography;

export default function RoomsPage() {
  useRoleGuard(['SuperAdmin']);
  const { homeId } = useParams();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const [form] = Form.useForm();

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`/rooms/${homeId}`);
      setRooms(res.data);
    } catch (err) {
      message.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditRoom = (room: any) => {
    setEditingRoom(room);
    form.setFieldsValue({ name: room.name });
    setModalVisible(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await axios.delete(`/rooms/${roomId}`);
      message.success('Room deleted');
      fetchRooms();
    } catch {
      message.error('Failed to delete room');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRoom) {
        await axios.patch(`/rooms/${editingRoom.id}`, values);
        message.success('Room updated');
      } else {
        await axios.post(`/rooms/create`, { ...values, houseId: homeId });
        message.success('Room added');
      }
      setModalVisible(false);
      fetchRooms();
    } catch {
      message.error('Failed to save room');
    }
  };

  useEffect(() => {
    if (homeId) fetchRooms();
  }, [homeId]);

  const columns = [
    {
      title: 'Room Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span>
          <HomeOutlined style={{ marginRight: 6, color: '#2B6873' }} />
          <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditRoom(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this room?"
            onConfirm={() => handleDeleteRoom(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '40px 24px',
        minHeight: '100vh',
        background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ color: '#2B6873', margin: 0 }}>Rooms</Title>
        <Button
          type="primary"
          onClick={handleAddRoom}
          style={{ backgroundColor: '#2B6873', borderColor: '#2B6873' }}
        >
          <PlusOutlined /> Add Room
        </Button>
      </div>

      <Table
        dataSource={rooms}
        columns={columns}
        rowKey="id"
        bordered
        loading={loading}
        pagination={false}
        style={{ backgroundColor: 'white', borderRadius: 12 }}
      />

      <Modal
        open={modalVisible}
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Room Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a room name' }]}
          >
            <Input placeholder="Living Room" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
    