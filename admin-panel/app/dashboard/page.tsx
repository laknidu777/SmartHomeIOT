'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Switch, Row, Col, Spin, message, Button, Space } from 'antd';
import axios from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Modal, Form, Input } from 'antd';

const { Title } = Typography;

export default function DashboardPage() {
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [devicesByRoom, setDevicesByRoom] = useState<Record<string, any[]>>({});
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [blinkingDevice, setBlinkingDevice] = useState(null);

  const scrollRef = useRef(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<any>(null);
  const [form] = Form.useForm();

  // Create a message display function to handle all types of errors consistently
  const displayErrorMessage = (status: number, defaultMsg: string) => {
    if (status === 403) {
      message.error({
        content: (
          <div>
            <strong>Access Denied</strong>
            <div style={{ fontSize: 12 }}>You don't have permission to control this device.</div>
          </div>
        ),
        duration: 4,
        style: { backgroundColor: '#fff3f3', border: '1px solid #ffccc7' },
      });
    } else if (status === 401) {
      message.error({
        content: (
          <div>
            <strong>Authentication Error</strong>
            <div style={{ fontSize: 12 }}>Your session may have expired. Please log in again.</div>
          </div>
        ),
        duration: 4,
        style: { backgroundColor: '#fff3f3', border: '1px solid #ffccc7' },
      });
    } else {
      message.error({
        content: defaultMsg,
        duration: 4,
      });
    }
  };

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
    } catch (err: any) {
      const status = err?.response?.status;
      displayErrorMessage(status, 'Failed to fetch rooms/devices');
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

  const updateDeviceState = (deviceId: string, newState: boolean) => {
    setDevicesByRoom(prev => {
      const updated = { ...prev };
      for (const roomId in updated) {
        updated[roomId] = updated[roomId].map(device =>
          device.id === deviceId ? { ...device, isOn: newState } : device
        );
      }
      return updated;
    });
  };

  // Global error handler for API requests
  const handleApiError = (err: any, context: string) => {
    const status = err?.response?.status;
    
    // Specific error handling based on HTTP status codes
    if (status === 403) {
      let errorMessage = "Access Denied";
      let detailMessage = "You don't have permission to perform this action.";
      
      // Check for specific error messages from the API
      if (err?.response?.data?.message) {
        detailMessage = err.response.data.message;
      }

      message.error({
        content: (
          <div>
            <strong>{errorMessage}</strong>
            <div style={{ fontSize: 12 }}>{detailMessage}</div>
          </div>
        ),
        duration: 4,
        style: { backgroundColor: '#fff3f3', border: '1px solid #ffccc7' },
      });
    } else if (status === 401) {
      message.error({
        content: (
          <div>
            <strong>Authentication Error</strong>
            <div style={{ fontSize: 12 }}>Your session has expired. Please log in again.</div>
          </div>
        ),
        duration: 4,
        style: { backgroundColor: '#fff3f3', border: '1px solid #ffccc7' },
      });
      // Optionally redirect to login
      // router.push('/login');
    } else {
      message.error({
        content: (
          <div>
            <strong>Error</strong>
            <div style={{ fontSize: 12 }}>{`Failed to ${context}. Please try again.`}</div>
          </div>
        ),
        duration: 4,
      });
    }
    
    console.error(`API Error (${context}):`, err);
  };

  const handleToggle = async (device: any) => {
    if (device.type === 'doorlock') {
      setCurrentDevice(device);
      setPinModalVisible(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const newState = device.isOn ? 0 : 1;

      await axios.patch(
        `/devices/${device.id}/state`,
        { state: newState },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateDeviceState(device.id, !!newState);
      message.success(`${device.name} ${newState ? 'turned on' : 'turned off'}`);
    } catch (err: any) {
      handleApiError(err, `toggle ${device.name}`);
    }
  };

  const handlePinSubmit = async (values: { pin: string }) => {
    if (!currentDevice) return;
    
    try {
      const token = localStorage.getItem('token');
      const newState = currentDevice.isOn ? 0 : 1;

      await axios.patch(
        `/devices/${currentDevice.id}/state`,
        { state: newState, pin: values.pin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateDeviceState(currentDevice.id, !!newState);
      message.success(`${currentDevice.name} ${newState ? 'unlocked' : 'locked'} successfully`);
      setPinModalVisible(false);
      form.resetFields();
    } catch (err: any) {
      const status = err?.response?.status;
      
      if (status === 403) {
        message.error({
          content: (
            <div>
              <strong>Incorrect PIN</strong>
              <div style={{ fontSize: 12 }}>The PIN you entered is incorrect. Please try again.</div>
            </div>
          ),
          duration: 4,
          style: { backgroundColor: '#fff3f3', border: '1px solid #ffccc7' },
        });
      } else {
        handleApiError(err, `unlock ${currentDevice.name}`);
      }
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
      <Modal
        title={`${currentDevice?.isOn ? 'Lock' : 'Unlock'} ${currentDevice?.name}`}
        open={pinModalVisible}
        onCancel={() => {
          setPinModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={currentDevice?.isOn ? 'Lock' : 'Unlock'}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePinSubmit}
          onFinishFailed={() => {
            message.error('PIN is required to proceed');
          }}
        >
          <Form.Item
            name="pin"
            label="Enter PIN"
            rules={[{ required: true, message: 'PIN is required' }]}
          >
            <Input.Password maxLength={6} />
          </Form.Item>
        </Form>
      </Modal>

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
                      device.type === 'doorlock' ? (
                        <Button
                          type="primary"
                          disabled={!device.isOnline}
                          onClick={() => handleToggle(device)}
                        >
                          {device.isOn ? 'Lock' : 'Unlock'}
                        </Button>
                      ) : (
                        <Switch
                          checked={device.isOn}
                          onChange={() => handleToggle(device)}
                          disabled={!device.isOnline}
                        />
                      )
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
                      <span>
                        <strong>State:</strong> {device.isOn ? 'On' : 'Off'}
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