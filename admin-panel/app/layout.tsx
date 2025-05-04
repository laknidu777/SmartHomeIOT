// /app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import ProtectedLayout from '@/components/layout';
import { ReactNode } from 'react';
import { HomeProvider } from './context/HomeContext'; // ✅ fixed import

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Smart Home Admin',
  description: 'Manage your smart home system',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HomeProvider> {/* ✅ Wrap everything in HomeProvider */}
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </HomeProvider>
      </body>
    </html>
  );
}
