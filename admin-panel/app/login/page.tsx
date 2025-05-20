'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, Card, message, Spin } from 'antd';
import axios from '../../lib/api';
import Link from 'next/link'; // make sure this is imported


const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false); // for spinner

  interface LoginFormValues {
    email: string;
    password: string;
  }

  useEffect(() => {
    // Simulate style/fonts loading
    const timer = setTimeout(() => {
      setPageReady(true);
    }, 300); // adjust if needed
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (values: LoginFormValues) => {
    const { email, password } = values;
    try {
      setLoading(true);
      const res = await axios.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/homes');
    } catch (err) {
      console.error(err);
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5',
      }}>
        <Spin size="large" tip="Loading AUTOHOME.GLOBAL..." />
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to right, #e0f2f1, #f5f5f5)',
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          border: 'none',
          padding: 24,
        }}
      >
        <Title level={3} style={{ textAlign: 'center', color: '#2B6873', marginBottom: 4 }}>
          AUTOHOME.<Text strong style={{ color: '#000' }}>GLOBAL</Text>
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Welcome back — control your smart space
        </Text>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Invalid email address' },
            ]}
          >
            <Input placeholder="you@example.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            size="large"
            style={{
              backgroundColor: '#005575',
              borderColor: '#2B6873',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3f7d87')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2B6873')}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = '#1e4d56')}
            onMouseUp={(e) => (e.currentTarget.style.backgroundColor = '#3f7d87')}
          >
            Login
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Don’t have an account?{' '}
              <Link href="/signup" style={{ color: '#005575', fontWeight: 500 }}>
                Sign up
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
