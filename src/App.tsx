import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import LandingPage from './views/LandingPage';
import WebApp from './views/WebApp';

const isNative = Capacitor.isNativePlatform();

export default function App() {
  const [view, setView] = useState<'landing' | 'webapp'>(
    isNative ? 'webapp' : 'landing'
  );
  const [updateRequired, setUpdateRequired] = useState(false);

  useEffect(() => {
    if (isNative) {
      // Automatic updater detection system mock
      // Replace with actual endpoint to fetch latest app version
      setTimeout(() => {
        const currentVersion = "1.3.0";
        const latestVersion = "1.3.0"; // Change this on server to > 1.3.0 to trigger update
        if (latestVersion > currentVersion) {
          setUpdateRequired(true);
        }
      }, 1000);
    }
  }, []);

  if (updateRequired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-hw-bg p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-hw-accent/10 rounded-3xl flex items-center justify-center">
          <img src="./logo.png" alt="Logo" className="w-12 h-12 object-cover" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-mono text-white uppercase tracking-widest">Update Required</h1>
          <p className="text-[10px] text-hw-secondary font-mono leading-relaxed max-w-xs mx-auto">
            A new version of ScanGen-PRO is available. Please update the app to continue using the latest features and bug fixes.
          </p>
        </div>
        <a 
          href="https://abdullach56.github.io/ScanGen-PRO/" 
          className="bg-hw-accent text-white px-8 py-3 rounded-2xl font-bold text-[11px] font-mono uppercase tracking-widest active:scale-95 transition-transform"
        >
          Update Now
        </a>
      </div>
    );
  }

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
