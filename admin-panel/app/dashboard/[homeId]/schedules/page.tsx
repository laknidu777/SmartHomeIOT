// New SchedulePage with full logic and styled UI
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Radio,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import axios from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;

export default function SchedulePage() {
  const { homeId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (homeId) fetchRooms();
  }, [homeId]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchDevices();
      fetchSchedules();
    }
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`/rooms/${homeId}`);
      setRooms(res.data);
      if (res.data.length > 0) setSelectedRoomId(res.data[0].id);
    } catch {
      message.error('Failed to load rooms');
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`/devices/${selectedRoomId}`);
      setDevices(res.data);
    } catch {
      message.error('Failed to load devices');
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`/schedules/${selectedRoomId}`);
      setSchedules(res.data);
    } catch {
      message.error('Failed to load schedules');
    }
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      deviceId: schedule.UserHomeDevice.deviceId,
      action: schedule.action,
      dateTime: dayjs(schedule.time),
      time: dayjs(schedule.time),
      repeat: schedule.repeat,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/schedules/${id}`);
      message.success('Schedule deleted');
      fetchSchedules();
    } catch {
      message.error('Failed to delete schedule');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dateTime = values.dateTime.set({
        hour: values.time.hour(),
        minute: values.time.minute(),
      });
      const payload = {
        deviceId: values.deviceId,
        roomId: selectedRoomId,
        action: values.action,
        time: dateTime.toISOString(),
        repeat: values.repeat,
      };

      if (editingSchedule) {
        await axios.patch(`/schedules/${editingSchedule.id}`, payload);
        message.success('Schedule updated');
      } else {
        await axios.post('/schedules', payload);
        message.success('Schedule added');
      }
      setModalVisible(false);
      fetchSchedules();
    } catch {
      message.error('Failed to save schedule');
    }
  };

  const columns = [
    {
      title: 'Device',
      dataIndex: ['UserHomeDevice', 'Device', 'name'],
    },
    {
      title: 'Action',
      dataIndex: 'action',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Repeat',
      dataIndex: 'repeat',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => (s ? 'Active' : 'Inactive'),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this schedule?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '40px 24px', minHeight: '100vh', background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ color: '#2B6873' }}>Schedules</Title>
        <Button type="primary" onClick={handleAdd} style={{ backgroundColor: '#2B6873', borderColor: '#2B6873' }}>+ Add Schedule</Button>
      </div>

      <Select
        value={selectedRoomId}
        onChange={setSelectedRoomId}
        style={{ width: 240, marginBottom: 24 }}
        placeholder="Select Room"
      >
        {rooms.map((room) => (
          <Option key={room.id} value={room.id}>{room.name}</Option>
        ))}
      </Select>

      <Table
        dataSource={schedules}
        columns={columns}
        rowKey="id"
        pagination={false}
        style={{ backgroundColor: 'white', borderRadius: 12 }}
      />

      <Modal
        title={editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item name="deviceId" label="Device" rules={[{ required: true, message: 'Please select a device' }]}> 
            <Select placeholder="Select Device">
              {devices.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="action" label="Action" rules={[{ required: true, message: 'Please choose an action' }]}> 
            <Radio.Group>
              <Radio value="on">On</Radio>
              <Radio value="off">Off</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="dateTime" label="Date" rules={[{ required: true, message: 'Please pick a date' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time" label="Time" rules={[{ required: true, message: 'Please pick a time' }]}> 
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="repeat" label="Repeat" initialValue="once"> 
            <Select>
              <Option value="once">Once</Option>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
