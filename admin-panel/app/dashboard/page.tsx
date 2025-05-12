// /app/dashboard/page.js (web version of SmartDashboard)
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Switch, Row, Col, Spin, message, Button, Space } from 'antd';
import axios from '@/lib/api';
import { getSocket } from '@/lib/socket';

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
      const homeId = localStorage.getItem('selectedHomeId');
      const res = await axios.get(`/rooms/with-devices/${homeId}`);
      const roomsWithDevices: { id: string; name: string; devices: any[] }[] = res.data;
  
      const devices: Record<string, any[]> = {};
      for (const room of roomsWithDevices) {
        devices[room.id] = room.devices || [];
      }
  
      setRooms(roomsWithDevices.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
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

 const handleToggle = async (deviceId: string, currentState: boolean) => {
  try {
    const token = localStorage.getItem('token');
    const newState = currentState ? 0 : 1; // 🔁 flip it manually

    await axios.patch(
      `/devices/${deviceId}/state`,
      { state: newState },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Optimistically update local state
    setDevicesByRoom(prev => {
      const updated = { ...prev };
      for (const roomId in updated) {
        updated[roomId] = updated[roomId].map(device =>
          device.id === deviceId ? { ...device, isOn: !!newState } : device
        );
      }
      return updated;
    });
  } catch (err) {
    message.error('Failed to toggle device');
  }
};


 return (
  <div
    style={{
      padding: '40px 24px',
      minHeight: '100vh',
      background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)',
    }}
  >
    <Title level={2} style={{ color: '#2B6873', textAlign: 'center', marginBottom: 40 }}>
      Smart Home Dashboard
    </Title>

    {loading ? (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" tip="Loading devices..." />
      </div>
    ) : (
      rooms.map((room) => (
        <div key={room.id} style={{ marginBottom: 48 }}>
          <Title level={4} style={{ color: '#2B6873' }}>{room.name}</Title>
          <Row gutter={[24, 24]}>
            {(devicesByRoom[room.id] || []).map((device) => (
              <Col key={device.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    background: device.isOnline ? '#ffffff' : '#f0f0f0',
                    opacity: device.isOnline ? 1 : 0.7,
                    transition: 'all 0.3s',
                  }}
                  title={
                    <span style={{ color: '#2B6873', fontWeight: 600 }}>{device.name}</span>
                  }
                  extra={
                    <Switch
                      checked={device.isOn}
                      onChange={() => handleToggle(device.id, device.isOn)}
                      disabled={!device.isOnline}
                    />
                  }
                >
                  <Space direction="vertical">
                    <span>
                      <strong>Status:</strong>{' '}
                      <span style={{ color: device.isOnline ? 'green' : 'red' }}>
                        {device.isOnline ? 'Online 🟢' : 'Offline 🔴'}
                      </span>
                    </span>
                    <span>
                      <strong>Type:</strong> {device.type}
                    </span>
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
