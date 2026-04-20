import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import LandingPage from './views/LandingPage';
import WebApp from './views/WebApp';

const isNative = Capacitor.isNativePlatform();

export default function App() {
  const [view, setView] = useState<'landing' | 'webapp'>(
    isNative ? 'webapp' : 'landing'
  );

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-[2px] bg-hw-accent/20 z-[9999] pointer-events-none" />
      
      {view === 'landing' && !isNative ? (
        <LandingPage onTryWeb={() => setView('webapp')} />
      ) : (
        <WebApp 
          isNative={isNative}
          onBack={isNative ? undefined : () => setView('landing')} 
        />
      )}
    </>
  );
}
