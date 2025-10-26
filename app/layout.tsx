import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EliteBuilders API',
  description: 'Hackathon platform backend API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
