'use client';

import { Layout, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Header } = Layout;

export default function AppHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <Header style={{ background: '#2B6873', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
      <Button type="text" icon={<MenuOutlined />} onClick={onToggle} style={{ marginRight: 16 }} />
      <h1 style={{ margin: 0, fontSize: '1.25rem', color:'white' }}>Smart Home Panel</h1>
    </Header>
  );
}
