'use client';

import { Layout } from 'antd';

const { Footer } = Layout;

export default function AppFooter() {
  return (
    <Footer style={{
      textAlign: 'center',
      background: '#005575', 
      color: 'white'
    }}>
      Smart Home ©{new Date().getFullYear()} Created by Laknidu
    </Footer>
  );
}
