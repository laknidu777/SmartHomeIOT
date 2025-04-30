// /app/dashboard/page.js (web version of SmartDashboard)
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Switch, Row, Col, Spin, message, Button, Space } from 'antd';
import axios from '@/lib/api';
import { getSocket, connectSocket } from '@/lib/socket';

const { Title } = Typography;

export default function DashboardPage() {
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [devicesByRoom, setDevicesByRoom] = useState<Record<string, any[]>>({});
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [blinkingDevice, setBlinkingDevice] = useState(null);

  const scrollRef = useRef(null);

  const fetchRoomsAndDevices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const homeId = localStorage.getItem('selectedHomeId');

      const res = await axios.get(`/rooms/${homeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const roomList = res.data || [];
      setRooms(roomList);

      const devices: Record<string, any[]> = {};
      for (const room of roomList) {
        const dRes = await axios.get(`/devices/${room.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        devices[room.id] = dRes.data || [];
      }
      setDevicesByRoom(devices);
    } catch (err) {
      message.error('Failed to fetch rooms/devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndDevices();

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const homeId = localStorage.getItem('selectedHomeId');
    if (homeId) socket.emit('registerDashboard', { homeId });

    socket.on('deviceStatusChange', ({ espId, isOnline }: { espId: string; isOnline: boolean }) => {
      setDevicesByRoom(prev => {
        const updated = { ...prev };
        for (const roomId in updated) {
          updated[roomId] = updated[roomId].map(device =>
            device.espId === espId ? { ...device, isOnline } : device
          );
        }
        return updated;
      });
    });

    return () => socket.off('deviceStatusChange');
  }, []);

  const handleToggle = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`/devices/toggle/${deviceId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { isOn } = res.data;
      setDevicesByRoom(prev => {
        const updated = { ...prev };
        for (const roomId in updated) {
          updated[roomId] = updated[roomId].map(device =>
            device.id === deviceId ? { ...device, isOn } : device
          );
        }
        return updated;
      });
    } catch (err) {
      message.error('Failed to toggle device');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Dashboard</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        rooms.map((room, index) => (
          <div key={room.id} style={{ marginBottom: 32 }}>
            <Title level={4}>{room.name}</Title>
            <Row gutter={[16, 16]}>
              {(devicesByRoom[room.id] || []).map((device) => (
                <Col key={device.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    title={device.name}
                    extra={<Switch checked={device.isOn} onChange={() => handleToggle(device.id)} disabled={!device.isOnline} />}
                    bordered
                  >
                    <Space direction="vertical">
                      <span>Status: {device.isOnline ? '🟢 Online' : '🔴 Offline'}</span>
                      <span>Type: {device.type}</span>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}
    </div>
  );
}
