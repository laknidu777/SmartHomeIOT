'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Typography, Form, Input, Button, message, Card } from 'antd';
import axios from '@/lib/api';

const { Title } = Typography;

export default function InviteStepOnePage() {
  const router = useRouter();
  const { homeId } = useParams();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    try {
      setLoading(true);
      await axios.post('/invites/send-code', {
        email,
        homeId,
        role: 'User', // default, can be changed in step 2
      });
      message.success('Verification code sent to email');
      router.push(`/dashboard/${homeId}/verify?email=${email}`);
    } catch (err) {
      message.error('Failed to send invite. Check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 480, margin: '0 auto' }}>
      <Card>
        <Title level={3}>Invite User to Home</Title>
        <Form layout="vertical" onFinish={handleSendCode}>
          <Form.Item label="User Email" required>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Form.Item>

          <Form.Item label="Home ID">
            <Input value={homeId} disabled />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Send Verification Code
          </Button>
        </Form>
      </Card>
    </div>
  );
}
