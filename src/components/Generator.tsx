import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Download, Type, QrCode, Barcode as BarcodeIcon, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { isValidBarcode } from '../lib/security';

export default function Generator() {
  const [text, setText] = useState('https://scanqoqrs.pro');
  const [type, setType] = useState<'qr' | 'barcode'>('qr');

  const isValid = useMemo(() => isValidBarcode(text, type), [text, type]);

  const downloadCode = () => {
    if (!isValid) return;
    
    const svg = document.getElementById('generated-code')?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `ScanOQRsPro-${type}-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    // Use Blob to handle UTF-8 characters safely
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
    
    // Clean up URL after load starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <div className="w-full space-y-4">
        <div className="flex bg-hw-bg/50 p-1 rounded-2xl border border-white/5 shadow-inner">
          <button
            onClick={() => setType('qr')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition-all duration-300",
              type === 'qr' ? "bg-hw-card text-white shadow-lg" : "text-hw-secondary hover:text-hw-card"
            )}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">QR Engine</span>
          </button>
          <button
            onClick={() => setType('barcode')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition-all duration-300",
              type === 'barcode' ? "bg-hw-card text-white shadow-lg" : "text-hw-secondary hover:text-hw-card"
            )}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Barcode Engine</span>
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Type className={cn("w-4 h-4 transition-colors", isValid ? "text-hw-secondary" : "text-red-500")} />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL..."
            className={cn(
              "w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-mono transition-all outline-none",
              isValid ? "border-hw-card/10 focus:border-hw-card shadow-sm" : "border-red-500/50 focus:border-red-500 bg-red-50 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            )}
          />
          <AnimatePresence>
            {!isValid && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-red-500"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase font-black">Invalid Format</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        layout
        className={cn(
          "relative p-8 bg-white rounded-[2.5rem] shadow-2xl border-4 transition-colors duration-500 group",
          isValid ? "border-hw-card" : "border-red-500 opacity-50 grayscale"
        )}
      >
        <div id="generated-code" className="flex items-center justify-center min-h-[200px] min-w-[200px]">
          {type === 'qr' ? (
            <QRCodeSVG
              value={text || ' '}
              size={200}
              level="H"
              includeMargin={false}
            />
          ) : (
            <div className="scale-125 px-4 overflow-hidden">
              {isValid ? (
                <Barcode 
                  value={text || ' '} 
                  width={1.6} 
                  height={80} 
                  fontSize={10}
                  background="transparent"
                />
              ) : (
                <div className="w-40 h-20 bg-hw-bg/5 flex items-center justify-center rounded-lg border border-dashed border-red-300">
                   <p className="text-[8px] font-mono text-red-400 uppercase">Input Unreadable</p>
                </div>
              )}
            </div>
          )}
        </div>

        {isValid && (
          <button
            onClick={downloadCode}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-hw-accent text-white p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all shadow-hw-accent/30 group-hover:rotate-6"
          >
            <Download className="w-6 h-6" />
          </button>
        )}
      </motion.div>

      <div className="text-center space-y-1 pt-6">
        <p className="text-[10px] font-mono text-hw-secondary uppercase tracking-[0.2em] font-bold">Pro Generator Hub</p>
        <p className="text-[9px] font-mono text-hw-secondary/40 uppercase tracking-widest leading-relaxed">
          {type === 'qr' ? 'Supports High-Capacity Encoded URIs' : 'Standard Linear Symbology Output'}
        </p>
      </div>
    </div>
  );
}
