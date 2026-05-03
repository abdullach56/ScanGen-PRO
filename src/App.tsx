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
      // Automatic updater detection system
      // Fetches the latest version from the deployed version.json file
      const checkUpdate = async () => {
        try {
          // This should match the current release version of the app
          const currentVersion = "1.3.1"; 
          
          // Append timestamp to prevent caching
          const response = await fetch(`https://abdullach56.github.io/ScanGen-PRO/version.json?t=${new Date().getTime()}`);
          
          if (response.ok) {
            const data = await response.json();
            const latestVersion = data.version;
            
            // Compare versions (e.g., "1.4.0" > "1.3.0")
            const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0;
            
            if (isNewer) {
              setUpdateRequired(true);
            }
          }
        } catch (error) {
          console.error("Failed to check for app updates:", error);
        }
      };

      setTimeout(checkUpdate, 1500);
    }
  }, []);

  if (updateRequired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-hw-bg p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center">
          <img src="./logo.png" alt="Logo" className="w-12 h-12 object-cover" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-sans text-slate-900">Update Required</h1>
          <p className="text-sm text-hw-secondary font-sans leading-relaxed max-w-xs mx-auto">
            A new version of ScanGen-PRO is available. Please update the app to continue using the latest features and bug fixes.
          </p>
        </div>
        <a 
          href="https://abdullach56.github.io/ScanGen-PRO/" 
          className="bg-hw-accent text-white px-8 py-3 rounded-xl font-bold text-sm font-sans shadow-sm active:scale-95 transition-transform"
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
