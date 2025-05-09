'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Typography,
  Space,
  Tag,
  message,
  Modal,
  Checkbox,
  Row,
  Col,
} from 'antd';
import axios from '@/lib/api';

const { Title } = Typography;

export default function UserManagementTable() {
  const { homeId } = useParams();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [userRoomsMap, setUserRoomsMap] = useState<Record<string, any[]>>({});
  const [userDevicesMap, setUserDevicesMap] = useState<Record<string, any[]>>({});

  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [selectedUserForRoom, setSelectedUserForRoom] = useState<any>(null);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [selectedUserForDevice, setSelectedUserForDevice] = useState<any>(null);
  const [allDevices, setAllDevices] = useState<any[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/users/in-home/${homeId}`);
      const userList = res.data;
      setUsers(userList);

      const roomAssignments: Record<string, any[]> = {};
      const deviceAssignments: Record<string, any[]> = {};

      await Promise.all(
        userList.map(async (user: any) => {
          try {
            const [roomRes, deviceRes] = await Promise.all([
              axios.get(`/users/rooms/${user.id}/${homeId}`),
              axios.get(`/users/devices/${user.id}/${homeId}`),
            ]);
            roomAssignments[user.id] = roomRes.data;
            deviceAssignments[user.id] = deviceRes.data;
          } catch {
            roomAssignments[user.id] = [];
            deviceAssignments[user.id] = [];
          }
        })
      );

      setUserRoomsMap(roomAssignments);
      setUserDevicesMap(deviceAssignments);
    } catch (err) {
      message.error('Failed to load users');
    }
  };

  const openRoomModal = async (user: any) => {
    setSelectedUserForRoom(user);
    try {
      const res = await axios.get(`/rooms/${homeId}`);
      setAllRooms(res.data);
      const current = userRoomsMap[user.id] || [];
      setSelectedRoomIds(current.map((r: any) => r.id));
      setRoomModalVisible(true);
    } catch (err) {
      message.error('Failed to load rooms');
    }
  };

  const openDeviceModal = async (user: any) => {
    setSelectedUserForDevice(user);
    try {
      const roomRes = await axios.get(`/users/rooms/${user.id}/${homeId}`);
      const roomIds = roomRes.data.map((r: any) => r.id);

      const devices: any[] = [];
      for (const roomId of roomIds) {
        const dRes = await axios.get(`/devices/${roomId}`);
        devices.push(...dRes.data);
      }
      setAllDevices(devices);

      const assignedRes = await axios.get(`/users/devices/${user.id}/${homeId}`);
      setSelectedDeviceIds(assignedRes.data.map((d: any) => d.id));

      setDeviceModalVisible(true);
    } catch (err) {
      message.error('Failed to load device data');
    }
  };

  const handleAssignRooms = async () => {
    try {
      await axios.post('/users/assign-rooms', {
        userId: selectedUserForRoom.id,
        homeId,
        roomIds: selectedRoomIds,
      });
      message.success('Rooms assigned successfully');
      setRoomModalVisible(false);
      fetchUsers();
    } catch {
      message.error('Failed to assign rooms');
    }
  };

  const handleAssignDevices = async () => {
    try {
      await axios.post('/users/assign-devices', {
        userId: selectedUserForDevice.id,
        homeId,
        deviceIds: selectedDeviceIds,
      });
      message.success('Devices assigned successfully');
      setDeviceModalVisible(false);
      fetchUsers();
    } catch {
      message.error('Failed to assign devices');
    }
  };

  const columns = [
    {
      title: 'Users',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <strong>{email}</strong>,
    },
    {
      title: 'Assigned Rooms',
      key: 'rooms',
      render: (_: any, record: any) => (
        <Space direction="vertical">
          {(userRoomsMap[record.id] || []).map((room: any) => (
            <Tag key={room.id}>{room.name}</Tag>
          ))}
          <Button type="link" onClick={() => openRoomModal(record)}>
            + Add Rooms
          </Button>
        </Space>
      ),
    },
    {
      title: 'Assigned Devices',
      key: 'devices',
      render: (_: any, record: any) => (
        <Space direction="vertical">
          {(userDevicesMap[record.id] || []).map((device: any) => (
            <Tag key={device.id}>{device.name}</Tag>
          ))}
          <Button type="link" onClick={() => openDeviceModal(record)}>
            + Add Devices
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (homeId) fetchUsers();
  }, [homeId]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Users & Access</Title>
        <Button type="primary" onClick={() => router.push(`/dashboard/${homeId}/invite`)}>
      + Add User
    </Button>

      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        bordered
        pagination={false}
      />

      {/* Room Modal */}
      <Modal
        open={roomModalVisible}
        title={`Assign Rooms to ${selectedUserForRoom?.email}`}
        onCancel={() => setRoomModalVisible(false)}
        onOk={handleAssignRooms}
        okText="Assign"
      >
        <Checkbox.Group
          style={{ width: '100%' }}
          value={selectedRoomIds}
          onChange={(checkedValues) => setSelectedRoomIds(checkedValues as string[])}
        >
          <Row gutter={[8, 8]}>
            {allRooms.map((room) => (
              <Col span={8} key={room.id}>
                <Checkbox value={room.id}>{room.name}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Modal>

      {/* Device Modal */}
      <Modal
        open={deviceModalVisible}
        title={`Assign Devices to ${selectedUserForDevice?.email}`}
        onCancel={() => setDeviceModalVisible(false)}
        onOk={handleAssignDevices}
        okText="Assign"
      >
        <Checkbox.Group
          style={{ width: '100%' }}
          value={selectedDeviceIds}
          onChange={(checkedValues) => setSelectedDeviceIds(checkedValues as string[])}
        >
          <Row gutter={[8, 8]}>
            {allDevices.map((device) => (
              <Col span={8} key={device.id}>
                <Checkbox value={device.id}>{device.name}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Modal>
    </div>
  );
}
