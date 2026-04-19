import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, Image as ImageIcon, Smartphone, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ScannerProps {
  onScan: (decodedText: string, decodedResult: any) => void;
  mode?: 'qr' | 'barcode';
}

type CameraStatus = 'checking' | 'ready' | 'denied' | 'unavailable' | 'error' | 'scanning_file';

const SCAN_CONFIG = {
  fps: 15,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdgeSize * 0.7);
    return {
      width: qrboxSize,
      height: qrboxSize
    };
  },
  aspectRatio: 1.0,
};

const BARCODE_CONFIG = {
  fps: 15,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    return {
      width: Math.floor(viewfinderWidth * 0.85),
      height: Math.floor(viewfinderHeight * 0.35)
    };
  },
  aspectRatio: 1.0,
};

export default function Scanner({ onScan, mode = 'qr' }: ScannerProps) {
  const [status, setStatus] = useState<CameraStatus>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    // Small delay to ensure DOM is ready and any previous instances are cleared
    await new Promise(r => setTimeout(r, 100));
    
    await stopScanner();
    setStatus('checking');
    setErrorMsg(null);

    try {
      const formats = mode === 'barcode' 
        ? [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ]
        : [Html5QrcodeSupportedFormats.QR_CODE];

      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch (e) { /* ignore */ }
      }

      scannerRef.current = new Html5Qrcode("reader", { 
        formatsToSupport: formats,
        verbose: false 
      });

      const config = mode === 'barcode' ? BARCODE_CONFIG : SCAN_CONFIG;

      // Try back camera first
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          (decodedText, decodedResult) => {
            onScan(decodedText, decodedResult);
          },
          () => { /* empty failure callback */ }
        );
      } catch (e) {
        console.warn("Environment camera failed, trying any available camera...", e);
        // Fallback to any camera
        await scannerRef.current.start(
          { facingMode: "user" }, // Fallback to front or default
          config,
          (decodedText, decodedResult) => {
            onScan(decodedText, decodedResult);
          },
          () => { /* empty failure callback */ }
        );
      }

      setStatus('ready');
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      const errorStr = String(err).toLowerCase();
      
      if (errorStr.includes("permission") || errorStr.includes("notallowederror")) {
        setStatus('denied');
        setErrorMsg("Camera access denied. Please allow camera permissions in app settings to use the scanner.");
      } else if (errorStr.includes("not found") || errorStr.includes("notfounderror") || errorStr.includes("nodescriptorerror")) {
        setStatus('unavailable');
        setErrorMsg("No camera detected or camera interface is busy.");
      } else {
        setStatus('error');
        setErrorMsg("System failed to initialize hardware interface.");
      }
    }
  }, [mode, onScan, stopScanner]);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setStatus('scanning_file');
    try {
      const result = await scannerRef.current.scanFile(file, true);
      onScan(result, { decodedText: result });
      setStatus('ready');
    } catch (err) {
      setErrorMsg("No readable matrix detected.");
      setStatus('error');
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <div className={cn(
        "relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700",
        mode === 'qr' ? "aspect-square" : "aspect-[4/3] bg-[#050505]"
      )}>
        <div id="reader" className="w-full h-full object-cover" />
        
        {/* HUD Overlay */}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "border-2 border-hw-accent/30 rounded-3xl relative transition-all duration-500",
                mode === 'qr' ? "w-3/4 aspect-square" : "w-[85%] h-[40%]"
              )}>
                {/* HUD Corners */}
                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-hw-accent glow-accent rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-hw-accent glow-accent rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-hw-accent glow-accent rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-hw-accent glow-accent rounded-br-2xl" />

                {/* Scanning Line */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/2 -translate-x-1/2 w-[90%] h-[2px] bg-hw-accent glow-accent opacity-60"
                />

                {/* HUD Data Text */}
                <div className="absolute -bottom-12 left-0 right-0 flex justify-between px-2 text-[8px] font-mono text-hw-accent/60 uppercase tracking-widest">
                  <span>X_{Math.random().toString(16).slice(2, 6)}</span>
                  <span>PROC_EN_AUTO</span>
                  <span>Y_{Math.random().toString(16).slice(2, 6)}</span>
                </div>
              </div>
            </div>
            
            {/* Ambient vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {(status === 'checking' || status === 'scanning_file') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-hw-bg/90 backdrop-blur-md"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-hw-accent/10 border-t-hw-accent animate-spin" />
                <Cpu className="absolute inset-0 m-auto w-8 h-8 text-hw-accent animate-pulse" />
              </div>
              <p className="mt-6 text-[10px] font-mono text-white uppercase tracking-[0.4em] animate-pulse pl-1">
                {status === 'checking' ? 'Initializing Core' : 'Parsing Matrix'}
              </p>
            </motion.div>
          )}

          {(status === 'denied' || status === 'unavailable' || status === 'error') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-hw-card/95 p-10 text-center backdrop-blur-lg"
            >
              <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mb-6 glow-accent border-hw-accent/20">
                {status === 'denied' ? (
                  <ShieldAlert className="w-10 h-10 text-hw-accent" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-hw-accent" />
                )}
              </div>
              <h3 className="text-white font-mono text-sm uppercase font-bold mb-3 tracking-widest">{status === 'denied' ? 'Access Denied' : 'System Error'}</h3>
              <p className="text-hw-secondary text-[10px] font-mono mb-8 uppercase leading-relaxed max-w-[240px] tracking-tight">
                {errorMsg}
              </p>
              <button
                onClick={startScanner}
                className="bg-hw-accent text-white px-8 py-3 rounded-2xl text-[10px] font-mono uppercase tracking-[0.3em] font-bold glow-accent hover:scale-105 active:scale-95 transition-all"
              >
                Re-Initialize
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Indicators */}
        {status === 'ready' && (
          <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
            <div className="w-2 h-2 rounded-full bg-hw-accent animate-ping glow-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-black leading-none mb-1">Live_Feed_ON</span>
               <span className="text-[8px] font-mono text-hw-accent uppercase opacity-60">Mode: {mode.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 glass-button text-white py-5 rounded-[2rem] text-[11px] font-mono uppercase tracking-[0.2em] font-bold group"
        >
          <ImageIcon className="w-5 h-5 text-hw-accent group-hover:scale-110 transition-transform glow-accent" /> 
          Upload Encoded Image
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileScan} 
        />
      </div>

      <div className="text-center space-y-1.5 pt-2">
        <p className="text-[9px] font-mono text-hw-secondary uppercase tracking-[0.3em] font-bold opacity-40">
          Hardware Interface active :: Back_Cam
        </p>
        <p className="text-[8px] font-mono text-hw-accent/40 uppercase tracking-[0.1em]">
          Standard: {mode === 'qr' ? 'ISO/IEC 18004 Matrix' : 'EAN-13 / UPC / LINEAR_SYM'}
        </p>
      </div>
    </div>
  );
}
