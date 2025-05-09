'use client';
import { Drawer, Menu } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
export default function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [homeId, setHomeId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('selectedHomeId');
    setHomeId(storedId);
  }, []);

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
        {/* <Menu.Item key="/dashboard/${homeId}/rooms"><Link href="/rooms">Rooms</Link></Menu.Item> */}
        {/* <Menu.Item key="/devices"><Link href="/devices">Devices</Link></Menu.Item> */}
        {/* <Menu.Item key="/hubs"><Link href="/hubs">Hubs</Link></Menu.Item> */}
        {homeId && (
          <>
            <Menu.Item key="/Rooms">
              <Link href={`/dashboard/${homeId}/rooms`}>Rooms</Link>
            </Menu.Item>
            <Menu.Item key="/hubs">
              <Link href={`/dashboard/${homeId}/hub`}>Hubs</Link>
            </Menu.Item>
            <Menu.Item key="/devices">
              <Link href={`/dashboard/${homeId}/devices`}>Devices</Link>
            </Menu.Item>
            <Menu.Item key="/users">
              <Link href={`/dashboard/${homeId}/users`}>Users</Link>
            </Menu.Item>
          </>
        )}
      </Menu>
    </Drawer>
  );
}
