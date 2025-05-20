'use client';

import { Layout, Button, Avatar, Dropdown } from 'antd';
import { MenuOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { theme } from '@/lib/theme';

const { Header } = Layout;

export default function AppHeader({ onToggle }: { onToggle: () => void }) {
  const handleLogout = () => {
    localStorage.clear(); // or clear just token/role
    window.location.href = '/'; // redirect to login/home
  };

  // Updated to use the new menu API instead of the deprecated overlay
  const menuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  return (
    <Header
      style={{
        background: theme.colors.primary,
        padding: '0 24px',
        height: theme.header.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left side: Menu + Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onToggle}
          style={{ color: theme.colors.white, fontSize: 18 }}
        />
        
        {/* Regular img tag as fallback */}
        <img
          src="/logo.png"
          alt="Smart Home Logo"
          width={36}
          height={36}
          style={{ objectFit: 'contain' }}
        />
        
        <h1
          style={{
            margin: 0,
            color: theme.colors.white,
            fontFamily: theme.font.family,
            fontWeight: theme.font.weight,
            fontSize: '1.2rem',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          AUTOHOME.GLOBAL
        </h1>
      </div>

      {/* Right side: Avatar dropdown */}
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
        <Avatar
          size="large"
          icon={<UserOutlined />}
          style={{ backgroundColor: '#ffffff33', cursor: 'pointer' }}
        />
      </Dropdown>
    </Header>
  );
}