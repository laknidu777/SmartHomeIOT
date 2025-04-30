'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Modal, Form, Input, Typography, message, Spin } from 'antd';
import axios from '@/lib/api';

const { Title } = Typography;

export default function HomesPage() {
  const router = useRouter();
  const [homes, setHomes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchHomes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/homes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHomes(res.data.homes || []);
    } catch (err) {
      message.error('Failed to load homes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomes();
  }, []);

  const handleSelectHome = (homeId: string) => {
    localStorage.setItem('selectedHomeId', homeId);
    router.push('/dashboard');
  };

  const handleAddHome = async (values: { name: string }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/homes', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Home added');
      setModalVisible(false);
      fetchHomes();
    } catch (err) {
      message.error('Failed to add home');
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <Title level={2}>Select Your Home</Title>
      <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginBottom: 24 }}>
        Add New Home
      </Button>

      {loading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          {homes.map((home) => (
            <Col key={home.id} span={8}>
              <Card
                hoverable
                title={home.name}
                onClick={() => handleSelectHome(home.id)}
                style={{ cursor: 'pointer' }}
              >
                Click to enter this home
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Add New Home"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddHome}>
          <Form.Item label="Home Name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
