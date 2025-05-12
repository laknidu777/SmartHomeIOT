'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, Card, message, Spin } from 'antd';
import Link from 'next/link';
import axios from '../../lib/api';

const { Title, Text } = Typography;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  interface SignupFormValues {
    email: string;
    password: string;
    name: string;
    fullName: string;
  }

  // simulate style/font loading
  useState(() => {
    const timer = setTimeout(() => {
      setPageReady(true);
    }, 300);
    return () => clearTimeout(timer);
  });

  const handleSignup = async (values: SignupFormValues) => {
    const { email, password, name, fullName } = values;
    try {
      setLoading(true);
      await axios.post('/auth/signup', { email, password, name, fullName });
      message.success('Account created successfully! Please log in.');
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || 'Signup failed';
      message.error(errorMsg);
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
          width: 460,
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
          Create your smart space account
        </Text>

        <Form layout="vertical" onFinish={handleSignup}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your short name' }]}
          >
            <Input placeholder="john" size="large" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="John Thilakawardhana" size="large" />
          </Form.Item>

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
              backgroundColor: '#2B6873',
              borderColor: '#2B6873',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3f7d87')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2B6873')}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = '#1e4d56')}
            onMouseUp={(e) => (e.currentTarget.style.backgroundColor = '#3f7d87')}
          >
            Sign Up
          </Button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#2B6873', fontWeight: 500 }}>
                Log in
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
