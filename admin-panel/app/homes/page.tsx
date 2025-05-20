'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Modal, Form, Input, Typography, message, Spin } from 'antd';
import axios from '@/lib/api';
import { useHome } from '@/app/context/HomeContext';

const { Title, Text } = Typography;

export default function HomesPage() {
  const router = useRouter();
  const [homes, setHomes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { setHomeId, setHomeName } = useHome(); 
  const [form] = Form.useForm();


  const fetchHomes = async () => {
    try {
      const res = await axios.get('/houses/my-houses');
      setHomes(res.data || []);
    } catch (err) {
      message.error('Failed to load homes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomes();
  }, []);

  const handleSelectHome = async (homeId: string) => {
  const selected = homes.find((h) => h.id === homeId);
  setHomeId(homeId);
  setHomeName(selected?.name);
  localStorage.setItem('selectedHomeId', homeId);

  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/houses/${homeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const role = res.data.role;
    localStorage.setItem('userRole', role); // Save role for later access
  } catch (err) {
    message.error('Failed to fetch user role');
  }

  router.push('/dashboard');
};


 const handleAddHome = async (values: { name: string; address?: string }) => {
  try {
    const res = await axios.post('/houses/create', values);
    message.success('Home added');

    const newHomeId = res.data?.house?.id;
    const newHomeName = res.data?.house?.name;

    setModalVisible(false);
    form.resetFields();
    fetchHomes();

    // Auto-select new home
    if (newHomeId) {
      setHomeId(newHomeId);
      setHomeName(newHomeName);
      localStorage.setItem('selectedHomeId', newHomeId);
      router.push('/dashboard');
    }
  } catch (err) {
    message.error('Failed to add home');
  }
};


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)',
      padding: '60px 40px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Title level={2} style={{ color: '#2B6873', textAlign: 'center', marginBottom: 40 }}>
          Select Your Home
        </Title>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Button
            type="primary"
            onClick={() => setModalVisible(true)}
            size="large"
            style={{
              backgroundColor: '#005575',
              borderColor: '#2B6873',
              transition: '0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3f7d87')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2B6873')}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = '#1e4d56')}
            onMouseUp={(e) => (e.currentTarget.style.backgroundColor = '#3f7d87')}
          >
            + Add New Home
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <Spin size="large" tip="Loading your homes..." />
          </div>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {homes.map((home) => (
              <Col key={home.id} xs={24} sm={12} md={8}>
                <Card
            hoverable
            onClick={() => handleSelectHome(home.id)}
            style={{
              cursor: 'pointer',
              borderRadius: 16,
              height: 160,
              background: '#ffffff',
              border: '1px solid #d9d9d9',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            bodyStyle={{
              padding: 0,
            }}
          >
            <Text
              style={{
                color: '#2B6873',
                fontSize: 20,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {home.name}
            </Text>
          </Card>
              </Col>
            ))}
          </Row>
        )}
        <Modal
          title={<span style={{ color: '#2B6873' }}>Add New Home</span>}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields(); // 🧼 clear inputs
          }}
          footer={null}
          centered
        >

          <Form form={form} layout="vertical" onFinish={handleAddHome}>
            <Form.Item
              label="Home Name"
              name="name"
              rules={[{ required: true, message: 'Enter a name' }]}
            >
              <Input size="large" placeholder="My Villa" />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
              rules={[{ required: true, message: 'Enter an address' }]}
            >
              <Input size="large" placeholder="123 Main Street" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                backgroundColor: '#2B6873',
                borderColor: '#2B6873',
              }}
            >
              Add Home
            </Button>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
