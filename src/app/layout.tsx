import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/AppLayout'; // Alterado

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Zaldi Imo - Fixed Asset Management',
  description: 'Manage your fixed assets efficiently with Zaldi Imo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} antialiased flex flex-col min-h-screen`}>
        <AppProviders>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
