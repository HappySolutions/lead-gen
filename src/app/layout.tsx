import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/core/i18n/useTranslation';

export const metadata: Metadata = {
  title: 'LeadGeni | B2B Business Prospecting',
  description: 'High-quality B2B lead generation with AI-assisted scoring.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
