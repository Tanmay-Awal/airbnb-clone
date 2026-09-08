import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { ToastProvider } from '@/components/Toast';
import { GlobalModals } from '@/components/GlobalModals';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Airbnb | Holiday rentals, cabins, beach houses & more',
  description: 'Book unique places to stay and things to do.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="font-sans antialiased text-[#222222] bg-white dark:bg-[#1A1A1A] selection:bg-airbnb-red selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <GlobalModals />
              </ToastProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
