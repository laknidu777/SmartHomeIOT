// /app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import ProtectedLayout from '@/components/layout'; // ✅ correct
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Smart Home Admin',
  description: 'Manage your smart home system',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProtectedLayout>{children}</ProtectedLayout>
      </body>
    </html>
  );
}
