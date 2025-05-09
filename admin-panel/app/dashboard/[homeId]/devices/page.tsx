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
} from 'antd';
import { useParams } from 'next/navigation';
import axios from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;

export default function HubsPage() {
  const { homeId } = useParams();
  const [hubs, setHubs] = useState<any[]>([]);
  const [unassignedDevices, setUnassignedDevices] = useState<any[]>([]);
  const [assignedDevicesMap, setAssignedDevicesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHub, setEditingHub] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      const [hubsRes, unassignedRes] = await Promise.all([
        axios.get(`/hubs/${homeId}`),
        axios.get(`/devices/unassigned/${homeId}`),
      ]);
      setHubs(hubsRes.data);
      setUnassignedDevices(unassignedRes.data);

      // Fetch assigned devices for each hub
      const deviceMap: Record<string, any[]> = {};
      await Promise.all(
        hubsRes.data.map(async (hub: any) => {
          const res = await axios.get(`/hubs/${hub.id}/devices`);
          deviceMap[hub.id] = res.data;
        })
      );
      setAssignedDevicesMap(deviceMap);
    } catch (err) {
      message.error('Failed to load hub data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (homeId) fetchData();
  }, [homeId]);

  const handleAddHub = () => {
    setEditingHub(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditHub = (hub: any) => {
    setEditingHub(hub);
    form.setFieldsValue(hub);
    setModalVisible(true);
  };

  const handleDeleteHub = async (hubId: string) => {
    try {
      await axios.delete(`/hubs/${hubId}`);
      message.success('Hub deleted');
      fetchData();
    } catch {
      message.error('Failed to delete hub');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingHub) {
        await axios.patch(`/hubs/${editingHub.id}`, values);
        message.success('Hub updated');
      } else {
        await axios.post(`/hubs`, { ...values, homeId });
        message.success('Hub added');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      message.error('Failed to save hub');
    }
  };

  const handleAssignDevice = async (deviceId: string, hubId: string) => {
    try {
      const hub = hubs.find(h => h.id === hubId);
      if (!hub) throw new Error('Hub not found');

      await axios.patch(`/devices/${deviceId}/assign-hub`, {
        hubId,
        ssid: hub.ssid,
        password: hub.password,
      });
      message.success('Device assigned');
      fetchData();
    } catch {
      message.error('Failed to assign device');
    }
  };

  const hubColumns = [
    {
      title: 'Hub Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SSID',
      dataIndex: 'ssid',
      key: 'ssid',
    },
    {
      title: 'Status',
      key: 'isOnline',
      render: (_: any, record: any) => (
        <Tag color={record.isOnline ? 'green' : 'red'}>
          {record.isOnline ? 'Online' : 'Offline'}
        </Tag>
      ),
    },
    {
      title: 'Assigned Devices',
      key: 'devices',
      render: (_: any, record: any) => (
        <Space wrap>
          {(assignedDevicesMap[record.id] || []).map((device: any) => (
            <Tag key={device.id}>{device.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => handleEditHub(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this hub?"
            onConfirm={() => handleDeleteHub(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Hubs</Title>
        <Button type="primary" onClick={handleAddHub}>
          + Add Hub
        </Button>
      </div>

      <Table
        dataSource={hubs}
        columns={hubColumns}
        rowKey="id"
        bordered
        loading={loading}
        pagination={false}
      />

      <Title level={4} style={{ marginTop: 32 }}>Unassigned Devices</Title>
      <Table
        dataSource={unassignedDevices}
        rowKey="id"
        columns={[
          {
            title: 'Device Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Assign to Hub',
            key: 'assign',
            render: (_: any, record: any) => (
              <Select
                placeholder="Select Hub"
                style={{ width: 200 }}
                onChange={(value) => handleAssignDevice(record.id, value)}
              >
                {hubs.map((hub) => (
                  <Option key={hub.id} value={hub.id}>{hub.name}</Option>
                ))}
              </Select>
            ),
          },
        ]}
        pagination={false}
        bordered
      />

      <Modal
        open={modalVisible}
        title={editingHub ? 'Edit Hub' : 'Add Hub'}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Hub Name"
            name="name"
            rules={[{ required: true, message: 'Please enter hub name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="SSID"
            name="ssid"
            rules={[{ required: true, message: 'Please enter SSID' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
