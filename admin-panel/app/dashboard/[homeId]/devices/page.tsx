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
  import { useParams } from 'next/navigation';
  import axios from '@/lib/api';

  const { Title } = Typography;
  const { Option } = Select;

  export default function DevicesPage() {
    const { homeId } = useParams();
    const [rooms, setRooms] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any>(null);
    const [form] = Form.useForm();

    const fetchRoomsAndDevices = async () => {
      try {
        setLoading(true);
        const roomRes = await axios.get(`/rooms/${homeId}`);
        const allRooms = roomRes.data || [];
        setRooms(allRooms);

        // Fetch devices for each room
        const allDevices: any[] = [];
        await Promise.all(
          allRooms.map(async (room: any) => {
            const devRes = await axios.get(`/devices/${room.id}`);
            devRes.data.forEach((d: any) => {
              allDevices.push({ ...d, roomName: room.name });
            });
          })
        );

        setDevices(allDevices);
      } catch (err) {
        message.error('Failed to load devices');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (homeId) {
        fetchRoomsAndDevices();
      }
    }, [homeId]);

   const openModal = (device: any = null) => {
  setEditingDevice(device);
  form.setFieldsValue({
    name: device?.name || '',
    espId: device?.espId || '',
    roomId: device?.RoomId || device?.roomId || '',
  });
  setModalVisible(true);
};
    const handleSubmit = async (values: any) => {
    try {
      if (editingDevice) {
        await axios.patch(`/devices/${editingDevice.id}`, values); 
        message.success('Device updated');
      } else {
        await axios.post('/devices/create', {
          ...values,
          houseId: homeId,
        });
        message.success('Device added');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDevice(null);
      fetchRoomsAndDevices();
    } catch {
      message.error('Failed to save device');
    }
  };
    const handleDelete = async (id: string) => {
      try {
        await axios.delete(`/devices/${id}`);
        message.success('Device deleted');
        fetchRoomsAndDevices();
      } catch (err) {
        message.error('Failed to delete device');
      }
    };

    const columns = [
      { title: 'Name', dataIndex: 'name' },
      // { title: 'Type', dataIndex: 'type' },
      { title: 'ESP ID', dataIndex: 'espId' },
      {
        title: 'Room',
        dataIndex: 'roomName',
        render: (text: string) => <Tag>{text}</Tag>,
      },
      {
        title: 'Actions',
        render: (_: any, record: any) => (
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
          open={modalVisible}
          title={editingDevice ? 'Edit Device' : 'Add Device'}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingDevice(null);
          }}
          footer={null}
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <Form.Item name="name" label="Device Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="espId" label="ESP ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            {/* <Form.Item name="type" label="Device Type" rules={[{ required: true }]}>
              <Input />
            </Form.Item> */}
            <Form.Item name="roomId" label="Assign to Room" rules={[{ required: true }]}>
              <Select placeholder="Select a room">
                {rooms.map((room) => (
                  <Option key={room.id} value={room.id}>
                    {room.name}
                  </Option>
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
