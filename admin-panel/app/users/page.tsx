'use client';

import { useState } from 'react';
import {
  Table, Modal, Button, Form, Input, Select, Tag, Checkbox, message, Space,
} from 'antd';

const { Option } = Select;

// Dummy data
const dummyRooms = [
  { id: 'room1', name: 'Living Room' },
  { id: 'room2', name: 'Bedroom' },
];

const dummyDevices = {
  room1: [
    { id: 'device1', name: 'Light' },
    { id: 'device2', name: 'Fan' },
  ],
  room2: [
    { id: 'device3', name: 'AC' },
  ],
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [assignRoomsModal, setAssignRoomsModal] = useState(null);
  const [assignDevicesModal, setAssignDevicesModal] = useState(null);

  const handleAddUser = (values) => {
    const newUser = {
      id: Date.now().toString(),
      ...values,
      rooms: [],
      deviceAccess: {},
    };
    setUsers((prev) => [...prev, newUser]);
    form.resetFields();
    setVisible(false);
    message.success('User added (dummy)');
  };

  const handleAssignRooms = (userId, selectedRooms) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, rooms: selectedRooms } : user
      )
    );
    setAssignRoomsModal(null);
  };

  const handleAssignDevices = (userId, roomId, selectedDeviceIds) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              deviceAccess: {
                ...user.deviceAccess,
                [roomId]: selectedDeviceIds,
              },
            }
          : user
      )
    );
    setAssignDevicesModal(null);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role) => <Tag color={role === 'owner' ? 'blue' : 'green'}>{role}</Tag>,
    },
    {
      title: 'Rooms',
      render: (_, user) => user.rooms?.map((r) => <Tag key={r}>{r}</Tag>),
    },
    {
      title: 'Actions',
      render: (_, user) => (
        <Space>
          <Button size="small" onClick={() => setAssignRoomsModal(user)}>Assign Rooms</Button>
          <Button size="small" onClick={() => setAssignDevicesModal(user)}>Assign Devices</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Users</h2>
      <Button type="primary" onClick={() => setVisible(true)} style={{ marginBottom: 16 }}>
        Add User
      </Button>

      <Table rowKey="id" dataSource={users} columns={columns} />

      {/* Add User Modal */}
      <Modal
        title="Add User"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddUser} form={form}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Option value="owner">Owner</Option>
              <Option value="member">Member</Option>
              <Option value="viewer">Viewer</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add
          </Button>
        </Form>
      </Modal>

      {/* Assign Rooms Modal */}
      {assignRoomsModal && (
        <Modal
          title={`Assign Rooms to ${assignRoomsModal.name}`}
          open
          onCancel={() => setAssignRoomsModal(null)}
          onOk={() =>
            handleAssignRooms(assignRoomsModal.id, assignRoomsModal._selectedRooms || [])
          }
        >
          <Checkbox.Group
            options={dummyRooms.map((r) => ({ label: r.name, value: r.id }))}
            defaultValue={assignRoomsModal.rooms}
            onChange={(val) => (assignRoomsModal._selectedRooms = val)}
          />
        </Modal>
      )}

      {/* Assign Devices Modal */}
      {assignDevicesModal && (
        <Modal
          title={`Assign Devices to ${assignDevicesModal.name}`}
          open
          onCancel={() => setAssignDevicesModal(null)}
          footer={null}
        >
          {assignDevicesModal.rooms.length === 0 ? (
            <p>This user has no assigned rooms.</p>
          ) : (
            assignDevicesModal.rooms.map((roomId) => (
              <div key={roomId} style={{ marginBottom: 16 }}>
                <strong>{dummyRooms.find((r) => r.id === roomId)?.name}</strong>
                <Checkbox.Group
                  options={dummyDevices[roomId]?.map((d) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                  defaultValue={
                    assignDevicesModal.deviceAccess?.[roomId] || []
                  }
                  onChange={(val) =>
                    handleAssignDevices(assignDevicesModal.id, roomId, val)
                  }
                />
              </div>
            ))
          )}
        </Modal>
      )}
    </div>
  );
}
