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
  Select,
  Tag,
  Spin,
} from 'antd';
import {
  ToolOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import axios from '@/lib/api';
import { useRoleGuard } from '../../../hooks/useRoleGuard';


const { Title } = Typography;
const { Option } = Select;

export default function DevicesPage() {
  useRoleGuard(['SuperAdmin']);
  const { homeId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceType, setDeviceType] = useState(null);
  const [form] = Form.useForm();

  const fetchRoomsAndDevices = async () => {
    try {
      setLoading(true);
      const roomRes = await axios.get(`/rooms/${homeId}`);
      const allRooms = roomRes.data || [];
      setRooms(allRooms);

      const allDevices = [];
      await Promise.all(
        allRooms.map(async (room) => {
          const devRes = await axios.get(`/devices/${room.id}`);
          devRes.data.forEach((d) => {
            allDevices.push({ ...d, roomName: room.name });
          });
        })
      );

      setDevices(allDevices);
    } catch {
      message.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (homeId) fetchRoomsAndDevices();
  }, [homeId]);

  const openModal = (device = null) => {
  setEditingDevice(device);
  setDeviceType(device?.type || null); // ✅ Track type
  form.resetFields();
  setModalVisible(true);
};


  const handleSubmit = async (values) => {
  try {
    if (editingDevice) {
      const payload = { ...values };

      if (deviceType === 'doorlock' && values.pin) {
        payload.pin = values.pin;
      }

      await axios.patch(`/devices/${editingDevice.id}`, payload);
      message.success('Device updated');
    } else {
      await axios.post('/devices/create', { ...values, houseId: homeId });
      message.success('Device added');
    }

    setModalVisible(false);
    form.resetFields();
    setEditingDevice(null);
    setDeviceType(null);
    fetchRoomsAndDevices();
  } catch {
    message.error('Failed to save device');
  }
};


  const handleDelete = async (id) => {
    try {
      await axios.delete(`/devices/${id}`);
      message.success('Device deleted');
      fetchRoomsAndDevices();
    } catch {
      message.error('Failed to delete device');
    }
  };

  const columns = [
    {
      title: 'Device Name',
      dataIndex: 'name',
      render: (text) => (
        <span><ToolOutlined style={{ marginRight: 6, color: '#2B6873' }} />{text}</span>
      ),
    },
    { title: 'ESP ID', dataIndex: 'espId' },
    {
      title: 'Room',
      dataIndex: 'roomName',
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this device?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '40px 24px', background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ color: '#2B6873' }}>Manage Devices</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          style={{ backgroundColor: '#2B6873', borderColor: '#2B6873' }}
        >
          Add Device
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <Spin size="large" tip="Loading devices..." />
        </div>
      ) : (
        <Table
          rowKey="id"
          dataSource={devices}
          columns={columns}
          pagination={{ pageSize: 8 }}
          style={{ backgroundColor: 'white', borderRadius: 12 }}
        />
      )}

      <Modal
        open={modalVisible}
        title={editingDevice ? 'Edit Device' : 'Add Device'}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDevice(null);
        }}
        footer={null}
        centered
        afterOpenChange={(open) => {
          if (open && editingDevice) {
            form.setFieldsValue({
              name: editingDevice.name,
              espId: editingDevice.espId,
              roomId: editingDevice.RoomId || editingDevice.roomId,
            });
          }
        }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Device Name"
            rules={[{ required: true, message: 'Please enter a device name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="espId"
            label="ESP ID"
            rules={[{ required: true, message: 'Please enter the ESP ID' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="roomId"
            label="Assign to Room"
            rules={[{ required: true, message: 'Please select a room' }]}
          >
            <Select placeholder="Select a room">
              {rooms.map((room) => (
                <Option key={room.id} value={room.id}>{room.name}</Option>
              ))}
            </Select>
          </Form.Item>
          {deviceType === 'doorlock' && (
            <Form.Item
              name="pin"
              label="PIN Number"
              rules={[{ required: true, message: 'Please enter a PIN' }]}
            >
              <Input.Password maxLength={6} />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" block style={{ backgroundColor: '#2B6873', borderColor: '#2B6873' }}>
            {editingDevice ? 'Update Device' : 'Create Device'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
