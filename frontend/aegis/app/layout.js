import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CAD Design Copilot',
  description: 'Generate CAD designs from natural language prompts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="flex flex-col min-h-screen bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}