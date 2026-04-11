import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, Image as ImageIcon, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ScannerProps {
  onScan: (decodedText: string, decodedResult: any) => void;
  mode?: 'qr' | 'barcode';
}

type CameraStatus = 'checking' | 'ready' | 'denied' | 'unavailable' | 'error' | 'scanning_file';

const SCAN_CONFIG = {
  fps: 10,
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
  fps: 10,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    return {
      width: Math.floor(viewfinderWidth * 0.8),
      height: Math.floor(viewfinderHeight * 0.3)
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
        } catch (e) {
          // ignore
        }
      }

      scannerRef.current = new Html5Qrcode("reader", { 
        formatsToSupport: formats,
        verbose: false 
      });

      const config = mode === 'barcode' ? BARCODE_CONFIG : SCAN_CONFIG;

      // Forced environment camera (back camera)
      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          onScan(decodedText, decodedResult);
        },
        () => {
          // Failure is ignored as it happens every frame no result is found
        }
      );

      setStatus('ready');
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      const msg = err?.toString().toLowerCase();
      if (msg.includes("permission")) {
        setStatus('denied');
        setErrorMsg("Camera access was denied.");
      } else if (msg.includes("not found")) {
        setStatus('unavailable');
        setErrorMsg("No camera detected.");
      } else {
        setStatus('error');
        setErrorMsg("Failed to start camera feed.");
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
      setErrorMsg("Could not find any code in this image.");
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
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      <div className={cn(
        "relative w-full rounded-3xl overflow-hidden border-4 border-hw-card shadow-2xl transition-all duration-500",
        mode === 'qr' ? "aspect-square" : "aspect-[4/3] bg-black"
      )}>
        <div id="reader" className="w-full h-full" />
        
        {/* Viewfinder Overlays */}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {mode === 'qr' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 aspect-square border-2 border-hw-accent/50 rounded-2xl relative shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-hw-accent shadow-[0_0_15px_rgba(255,68,68,1)]"
                  />
                  {/* Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-hw-accent" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-hw-accent" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-hw-accent" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-hw-accent" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[85%] h-1/3 border-2 border-hw-accent/50 rounded-lg relative shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-hw-accent shadow-[0_0_15px_rgba(255,68,68,1)]"
                  />
                  {/* Horizontal indicators */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-hw-accent/20 border-t border-dashed border-hw-accent" />
                </div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {(status === 'checking' || status === 'scanning_file') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-full border-4 border-hw-accent/20 border-t-hw-accent animate-spin flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-hw-accent" />
              </div>
              <p className="mt-4 text-xs font-mono text-white uppercase tracking-widest animate-pulse">
                {status === 'checking' ? 'Connecting to Camera' : 'Processing Image'}
              </p>
            </motion.div>
          )}

          {(status === 'denied' || status === 'unavailable' || status === 'error') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-hw-card p-8 text-center"
            >
              {status === 'denied' ? (
                <ShieldAlert className="w-16 h-16 text-hw-accent mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 text-hw-accent mb-4" />
              )}
              <h3 className="text-white font-mono text-sm uppercase font-bold mb-2">{status === 'denied' ? 'Access Denied' : 'HW Error'}</h3>
              <p className="text-hw-secondary text-[10px] font-mono mb-6 uppercase leading-relaxed max-w-[200px]">
                {errorMsg}
              </p>
              <button
                onClick={startScanner}
                className="bg-hw-accent text-white px-6 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Feed Indicator */}
        {status === 'ready' && (
          <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-hw-accent animate-pulse shadow-[0_0_10px_rgba(255,68,68,0.5)]" />
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest font-bold">SECURE_FEED</span>
            <div className="ml-2 px-2 py-0.5 bg-hw-accent/20 rounded border border-hw-accent/30">
              <span className="text-[8px] font-mono text-hw-accent uppercase">{mode}</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-hw-card text-white py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest hover:bg-hw-card/80 transition-all border border-white/5 shadow-xl shadow-black/20 group"
        >
          <ImageIcon className="w-5 h-5 text-hw-accent group-hover:scale-110 transition-transform" /> 
          Upload Image to Scan
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileScan} 
        />
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest block opacity-60">
          Hardware: Backend Camera Force-Active
        </p>
        <p className="text-[9px] font-mono text-hw-accent uppercase tracking-tighter">
          Protocols: {mode === 'qr' ? 'ISO/IEC 18004' : 'EAN / UPC / CODE-128'}
        </p>
      </div>
    </div>
  );
}
