
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/AppLayout'; 

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Zaldi Imo - Gestão de Ativos Imobilizados',
  description: 'Gerencie seus ativos imobilizados de forma eficiente com o Zaldi Imo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} antialiased flex flex-col min-h-screen`}>
        <AppProviders>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
