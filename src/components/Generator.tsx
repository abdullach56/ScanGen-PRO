import { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Type, QrCode, AlertTriangle, ShieldCheck, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { isValidQR } from '../lib/security';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const PRESET_COLORS = ['#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Generator() {
  const [text, setText] = useState('https://scangen-pro.com');
  const [fgColor, setFgColor] = useState('#0A0A0B');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatQRValue = (val: string) => {
    const cleaned = val.trim();
    if (/^\+?[\d\s-]{7,15}$/.test(cleaned)) {
      return `tel:${cleaned.replace(/[\s-]/g, '')}`;
    }
    return cleaned;
  };

  const finalQRValue = useMemo(() => formatQRValue(text), [text]);
  const isValid = useMemo(() => isValidQR(finalQRValue), [finalQRValue]);

  const autoLogoUrl = useMemo(() => {
    if (logoBase64) return logoBase64;
    return './logo.png';
  }, [text, logoBase64]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeLogo = () => {
    setLogoBase64(null);
  };

  const downloadCode = async () => {
    if (!isValid) return;
    
    const svg = document.getElementById('generated-code')?.querySelector('svg');
    if (!svg) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = "anonymous";
      
      img.onload = async () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
        }
        
        const pngDataUrl = canvas.toDataURL('image/png');

        if (Capacitor.isNativePlatform()) {
          try {
            const fileName = `ScanGenPRO-qr-${Date.now()}.png`;
            const base64Data = pngDataUrl.split(',')[1];
            
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents, // Using Documents as a safe public-ish spot, or Pictures
            });

            // For Gallery visibility on Android, we'd ideally use a more specific plugin 
            // or Share to trigger the intent and make it accessible.
            await Share.share({
              title: 'Saved QR Code',
              text: 'Check out your generated QR code',
              url: savedFile.uri,
              dialogTitle: 'Share or View QR Code',
            });
            
          } catch (err) {
            console.error("Save to gallery failed:", err);
          }
        } else {
          const downloadLink = document.createElement('a');
          downloadLink.download = `ScanGenPRO-qr-${Date.now()}.png`;
          downloadLink.href = pngDataUrl;
          downloadLink.click();
        }
      };

      const tempUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
      img.src = tempUrl;
      setTimeout(() => URL.revokeObjectURL(tempUrl), 100);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-md mx-auto relative z-10 pb-20">
      <div className="w-full space-y-6">
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <QrCode className="w-4 h-4 text-hw-accent" />
          </div>
          <span className="text-sm font-sans font-bold text-slate-900">QR Code Generator</span>
        </div>

        {/* Dynamic Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Type className={cn("w-4 h-4 transition-colors duration-300", isValid ? "text-hw-accent" : "text-red-500")} />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter URL, text, or data..."
            className={cn(
              "w-full bg-white border rounded-2xl py-4 pl-12 pr-4 text-sm font-sans transition-all outline-none placeholder:text-slate-400 text-slate-900 shadow-sm",
              isValid ? "border-hw-border focus:border-hw-accent focus:ring-4 focus:ring-hw-accent/10" : "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            )}
          />
          <AnimatePresence>
            {!isValid && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-red-500"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase font-black tracking-tighter">Too Long</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Customization Options */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 overflow-hidden"
        >
          <div className="bg-slate-50 border border-hw-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            {/* Logo Upload */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-sans font-bold text-slate-900">Custom Logo</p>
                <p className="text-[10px] font-sans text-hw-secondary mt-0.5">Auto-fetch from links if empty</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {logoBase64 && (
                  <button onClick={removeLogo} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-hw-border text-slate-700 text-xs font-sans font-bold flex items-center justify-center gap-2 rounded-lg text-center shadow-sm hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4" /> {logoBase64 ? 'Change' : 'Upload'}
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="h-px w-full bg-hw-border" />

            {/* Color Picker */}
            <div>
              <p className="text-xs font-sans font-bold text-slate-900 mb-3">Accent Color</p>
              <div className="flex items-center gap-3">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFgColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform duration-300",
                      fgColor === color ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "border-transparent scale-90 hover:scale-100"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        layout
        className={cn(
          "relative p-8 bg-white rounded-3xl shadow-sm border border-hw-border transition-all duration-700 group",
          !isValid && "opacity-50 grayscale blur-[2px]"
        )}
      >
        <div id="generated-code" className="flex items-center justify-center min-h-[220px] min-w-[220px] relative z-10">
          <QRCodeSVG
            value={finalQRValue || ' '}
            size={1024}
            style={{ width: 220, height: 220 }}
            level="H"
            includeMargin={true}
            fgColor={fgColor}
            imageSettings={autoLogoUrl ? {
              src: autoLogoUrl,
              height: 48,
              width: 48,
              excavate: true,
            } : undefined}
          />
        </div>

        {isValid && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            <button
              onClick={downloadCode}
              className="bg-hw-accent hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 group-hover:-translate-y-1"
              title={Capacitor.isNativePlatform() ? "Save to Gallery" : "Download QR"}
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-sans font-bold">
                {Capacitor.isNativePlatform() ? 'Save' : 'Download'}
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
