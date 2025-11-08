import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { db } from '@/lib/db';

function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize IndexedDB
    db.init().catch(console.error);

    // Register service worker for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('SW registered:', registration))
        .catch((error) => console.error('SW registration failed:', error));
    }
  }, []);

  return <Component {...pageProps} />;
}

export default appWithTranslation(App);
