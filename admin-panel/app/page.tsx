'use client';

import Image from 'next/image';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/login'; // Redirect after delay
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#005575',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
      }}
    >
      <Image
        src="/logo.png"
        alt="Smart Home Logo"
        width={120}
        height={120}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}
