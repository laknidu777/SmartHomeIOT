  'use client';

  import { useEffect, useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { Card, Row, Col, Button, Modal, Form, Input, Typography, message, Spin } from 'antd';
  import axios from '@/lib/api';
  import { useHome } from '@/app/context/HomeContext';


  const { Title } = Typography;

  export default function HomesPage() {
    const router = useRouter();
    const [homes, setHomes] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const { setHomeId, setHomeName } = useHome(); 

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

    // ✅ Get setters from context

  const handleSelectHome = (homeId: string) => {
    const selected = homes.find((h) => h.id === homeId);
    setHomeId(homeId);            // ✅ Save in React Context
    setHomeName(selected?.name); // Optional
    localStorage.setItem('selectedHomeId', homeId); // optional for persistence
    router.push('/dashboard');
  };


  const handleAddHome = async (values: { name: string; address?: string }) => {
    try {
      await axios.post('/houses/create', values);
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
            <Form.Item
              label="Home Name"
              name="name"
              rules={[{ required: true, message: 'Enter a name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
              rules={[{ required: true, message: 'Enter an address' }]}
            >
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
