'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useState } from 'react';
import { Typography, Form, Input, Button, message, Card, Select } from 'antd';
import axios from '@/lib/api';

const { Title } = Typography;
const { Option } = Select;

export default function VerifyInviteStepTwo() {
  const router = useRouter();
  const { homeId } = useParams();
  const searchParams = useSearchParams();

  const emailFromQuery = searchParams.get('email');

  const [email] = useState(emailFromQuery || '');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setLoading(true);
      await axios.post('/invites/verify', {
        email,
        code,
        homeId,
        role,
      });

      message.success('User verified and added to home');
      router.push(`/dashboard/${homeId}/users`);
    } catch (err) {
      message.error('Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 480, margin: '0 auto' }}>
      <Card>
        <Title level={3}>Verify Code & Assign Role</Title>
        <Form layout="vertical" onFinish={handleVerify}>
          <Form.Item label="Email">
            <Input value={email} disabled />
          </Form.Item>

          <Form.Item label="Verification Code" required>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </Form.Item>

          <Form.Item label="User Role">
            <Select value={role} onChange={setRole}>
              <Option value="User">User</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Verify & Assign
          </Button>
        </Form>
      </Card>
    </div>
  );
}