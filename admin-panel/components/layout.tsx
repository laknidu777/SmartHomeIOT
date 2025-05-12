'use client';

import { Layout } from 'antd';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AppHeader from './Header/page';
import AppFooter from './Footer/page';
import AppSidebar from './sidebar/page';
import { ReactNode } from 'react';

const { Content } = Layout;
const excludedRoutes = ['/login', '/homes' , '/signup', '/forgot-password', '/reset-password'];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const isExcluded = excludedRoutes.includes(pathname);

  if (isExcluded) return children;

  return (
    <Layout> 
      {/* <AppSidebar collapsed={collapsed} /> */}
       {/* Show Sidebar only if collapsed is false */}
       {!collapsed && <AppSidebar open={!collapsed} onClose={() => setCollapsed(true)} />}
      <Layout>
        <AppHeader onToggle={() => setCollapsed(!collapsed)} />
        <Content style={{ margin: '0px 0px 0' }}>
          <div style={{ padding: 0, minHeight: '80vh', background: '#fff' }}>
            {children}
          </div>
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  );
}
