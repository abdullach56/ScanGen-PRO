import { useState, useEffect } from 'react';
import LandingPage from './views/LandingPage';
import WebApp from './views/WebApp';

export default function App() {
  const [view, setView] = useState<'landing' | 'webapp'>('landing');

  // Handle browser back button or direct navigation if needed
  useEffect(() => {
    // Basic SEO: Update document title based on view
    if (view === 'landing') {
      document.title = 'ScanGen-PRO | Fast QR & Barcode Scanner';
    } else {
      document.title = 'ScanGen-PRO Web App';
    }
  }, [view]);

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-[2px] bg-hw-accent/20 z-[9999] pointer-events-none" />
      
      {view === 'landing' ? (
        <LandingPage onTryWeb={() => setView('webapp')} />
      ) : (
        <WebApp onBack={() => setView('landing')} />
      )}
    </>
  );
}
