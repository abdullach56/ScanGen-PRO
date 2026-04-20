import { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Download, Type, QrCode, Barcode as BarcodeIcon, AlertTriangle, ShieldCheck, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { isValidBarcode } from '../lib/security';

const PRESET_COLORS = ['#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Generator() {
  const [text, setText] = useState('https://scangen-pro.com');
  const [type, setType] = useState<'qr' | 'barcode'>('qr');
  const [fgColor, setFgColor] = useState('#0A0A0B');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid = useMemo(() => isValidBarcode(text, type), [text, type]);

  const autoLogoUrl = useMemo(() => {
    if (logoBase64) return logoBase64;
    try {
      const url = new URL(text);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url.origin)}&size=128`;
      }
    } catch {
      // not a valid URL
    }
    return undefined;
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

  const downloadCode = () => {
    if (!isValid) return;
    
    // For QR Code, SVG inside Generator
    const svg = document.getElementById('generated-code')?.querySelector('svg');
    if (!svg) {
        // Fallback for barcode if SVG is not used directly (react-barcode uses SVG internally)
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Convert cross-origin logo warning bypass for download
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `ScanGenPRO-${type}-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    const tempUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    img.src = tempUrl;
    
    setTimeout(() => URL.revokeObjectURL(tempUrl), 100);
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-md mx-auto relative z-10 pb-20">
      <div className="w-full space-y-6">
        {/* Engine Toggle */}
        <div className="glass-card p-1.5 rounded-[1.5rem] flex items-center relative gap-1">
          <button
            onClick={() => setType('qr')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-3 rounded-[1.2rem] transition-all duration-500 relative z-10",
              type === 'qr' ? "text-white" : "text-hw-secondary hover:text-white/60"
            )}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">QR Engine</span>
            {type === 'qr' && (
              <motion.div layoutId="engine-bg" className="absolute inset-0 bg-hw-accent rounded-[1.2rem] -z-10 glow-accent" />
            )}
          </button>
          <button
            onClick={() => setType('barcode')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-3 rounded-[1.2rem] transition-all duration-500 relative z-10",
              type === 'barcode' ? "text-white" : "text-hw-secondary hover:text-white/60"
            )}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Codabar</span>
            {type === 'barcode' && (
              <motion.div layoutId="engine-bg" className="absolute inset-0 bg-hw-accent rounded-[1.2rem] -z-10 glow-accent" />
            )}
          </button>
        </div>

        {/* Dynamic Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Type className={cn("w-4 h-4 transition-colors duration-300", isValid ? "text-hw-accent" : "text-red-500")} />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Payload data..."
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4.5 pl-14 pr-4 text-sm font-mono transition-all outline-none placeholder:text-hw-secondary/30",
              isValid ? "focus:border-hw-accent/50 focus:bg-white/[0.08]" : "border-red-500/50 bg-red-500/5"
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
                <span className="text-[9px] font-mono uppercase font-black tracking-tighter">Corrupt Data</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Customization Options */}
        <AnimatePresence>
          {type === 'qr' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 flex flex-col gap-4">
                {/* Logo Upload */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">Custom Logo</p>
                    <p className="text-[8px] font-mono text-hw-secondary uppercase tracking-widest mt-0.5 line-clamp-1">Auto-fetch from links if empty</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {logoBase64 && (
                      <button onClick={removeLogo} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/40 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 glass-button text-white text-[10px] font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-xl text-center shadow-lg"
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

                <div className="h-px w-full bg-white/5" />

                {/* Color Picker */}
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white mb-3">Accent Color</p>
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
          )}
        </AnimatePresence>
      </div>

      <motion.div
        layout
        className={cn(
          "relative p-10 bg-white rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.4)] transition-all duration-700 group",
          !isValid && "opacity-40 grayscale blur-[2px]"
        )}
      >
        <div className="absolute -top-3 -left-3 glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 glow-accent border-hw-accent/30 z-20">
          <ShieldCheck className="w-3 h-3 text-hw-accent" />
          <span className="text-[8px] font-mono text-hw-accent font-black uppercase">Secured_Output</span>
        </div>

        <div id="generated-code" className="flex items-center justify-center min-h-[220px] min-w-[220px] relative z-10">
          {type === 'qr' ? (
            <QRCodeSVG
              value={text || ' '}
              size={220}
              level="H"
              includeMargin={false}
              fgColor={fgColor}
              imageSettings={autoLogoUrl ? {
                src: autoLogoUrl,
                height: 48,
                width: 48,
                excavate: true,
              } : undefined}
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
                  lineColor={fgColor}
                />
              ) : (
                <div className="w-40 h-20 bg-hw-bg/5 flex items-center justify-center rounded-lg border border-dashed border-red-300">
                   <p className="text-[8px] font-mono text-red-400 uppercase">Invalid Symbology</p>
                </div>
              )}
            </div>
          )}
        </div>

        {isValid && (
          <button
            onClick={downloadCode}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-hw-accent text-white p-5 rounded-[1.5rem] shadow-[0_15px_30px_rgba(59,130,246,0.4)] hover:scale-110 active:scale-95 transition-all glow-accent group-hover:rotate-3 z-30"
          >
            <Download className="w-7 h-7" />
          </button>
        )}
      </motion.div>

      <div className="text-center space-y-2 pt-8">
        <p className="text-[10px] font-mono text-hw-secondary/60 uppercase tracking-[0.4em] font-black">Cryptographic Hub v4.0</p>
        <div className="flex items-center justify-center gap-4 opacity-30">
          <div className="h-px w-8 bg-hw-secondary" />
          <p className="text-[8px] font-mono text-hw-secondary uppercase">Alpha Protocol Active</p>
          <div className="h-px w-8 bg-hw-secondary" />
        </div>
      </div>
    </div>
  );
}
