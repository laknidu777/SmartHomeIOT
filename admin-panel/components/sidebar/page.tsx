'use client';

import { Drawer, Menu } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <Drawer
      title="SmartHome"
      placement="left"
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: 0 }}
    >
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={onClose} // auto-close drawer when link is clicked
      >
        <Menu.Item key="/homes"><Link href="/homes">Homes</Link></Menu.Item>
        <Menu.Item key="/dashboard"><Link href="/dashboard">Dashboard</Link></Menu.Item>
        <Menu.Item key="/rooms"><Link href="/rooms">Rooms</Link></Menu.Item>
        <Menu.Item key="/devices"><Link href="/devices">Devices</Link></Menu.Item>
        <Menu.Item key="/hubs"><Link href="/hubs">Hubs</Link></Menu.Item>
        <Menu.Item key="/users"><Link href="/users">Users</Link></Menu.Item>
      </Menu>
    </Drawer>
  );
}
