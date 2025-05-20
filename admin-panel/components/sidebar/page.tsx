'use client';

import {
  HomeOutlined,
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  UsbOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Drawer, Menu, Typography } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const { Title } = Typography;

export default function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [homeId, setHomeId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setHomeId(localStorage.getItem('selectedHomeId'));
    setUserRole(localStorage.getItem('userRole'));
  }, []);

  const isSuperAdmin = userRole === 'SuperAdmin';

  return (
    <Drawer
      title={
        <Title level={4} style={{ color: '#2B6873', margin: 0 }}>
          AUTOHOME.GLOBAL
        </Title>
      }
      placement="left"
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: 0 }}
      headerStyle={{ background: '#f0f2f5' }}
    >
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={onClose}
        style={{ borderRight: 0 }}
        theme="light"
        items={[
          {
            key: '/homes',
            icon: <HomeOutlined style={{ color: '#2B6873' }} />,
            label: <Link href="/homes">Homes</Link>,
          },
          {
            key: '/dashboard',
            icon: <DashboardOutlined style={{ color: '#2B6873' }} />,
            label: <Link href="/dashboard">Dashboard</Link>,
          },
          ...(homeId
            ? [
                ...(isSuperAdmin
                  ? [
                      {
                        key: '/users',
                        icon: <UserOutlined style={{ color: '#2B6873' }} />,
                        label: <Link href={`/dashboard/${homeId}/users`}>Users</Link>,
                      },
                      {
                        key: '/rooms',
                        icon: <AppstoreOutlined style={{ color: '#2B6873' }} />,
                        label: <Link href={`/dashboard/${homeId}/rooms`}>Rooms</Link>,
                      },
                      {
                        key: '/devices',
                        icon: <UsbOutlined style={{ color: '#2B6873' }} />,
                        label: <Link href={`/dashboard/${homeId}/devices`}>Devices</Link>,
                      },
                      {
                        key: '/User Profile',
                        icon: <ClockCircleOutlined style={{ color: '#2B6873' }} />,
                        label: <Link href={`/dashboard/${homeId}/profilepage`}>User Profile</Link>,
                      },
                    ]
                  : []),
                {
                  key: '/hubs',
                  icon: <UsbOutlined style={{ color: '#2B6873' }} />,
                  label: <Link href={`/dashboard/${homeId}/hub`}>Hubs</Link>,
                },
                {
                  key: '/schedules',
                  icon: <ClockCircleOutlined style={{ color: '#2B6873' }} />,
                  label: <Link href={`/dashboard/${homeId}/schedules`}>Schedules</Link>,
                },
              ]
            : []),
        ]}
      />
    </Drawer>
  );
}
