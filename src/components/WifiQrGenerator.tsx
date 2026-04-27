import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Wifi, Lock, ShieldCheck, Type } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const PRESET_COLORS = ['#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function WifiQrGenerator() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [isHidden, setIsHidden] = useState(false);
  const [fgColor, setFgColor] = useState('#0A0A0B');

  // Format: WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<PASSWORD>;H:<true|false>;;
  const finalQRValue = useMemo(() => {
    if (!ssid) return '';
    const esc = (str: string) => str.replace(/[\\;,:"]/g, '\\$&');
    return `WIFI:S:${esc(ssid)};T:${encryption};P:${esc(password)};H:${isHidden ? 'true' : 'false'};;`;
  }, [ssid, password, encryption, isHidden]);

  const isValid = ssid.length > 0;

  const downloadCode = async () => {
    if (!isValid) return;
    
    const svg = document.getElementById('wifi-generated-code')?.querySelector('svg');
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
            const fileName = `ScanGenPRO-wifi-${Date.now()}.png`;
            const base64Data = pngDataUrl.split(',')[1];
            
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents,
            });

            await Share.share({
              title: 'Saved WiFi QR Code',
              text: 'Connect to this WiFi network easily',
              url: savedFile.uri,
              dialogTitle: 'Share or View WiFi QR Code',
            });
            
          } catch (err) {
            console.error("Save to gallery failed:", err);
          }
        } else {
          const downloadLink = document.createElement('a');
          downloadLink.download = `ScanGenPRO-wifi-${Date.now()}.png`;
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-hw-accent/10 rounded-xl flex items-center justify-center">
            <Wifi className="w-4 h-4 text-hw-accent" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-white">WiFi QR Generator</span>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Wifi className={cn("w-4 h-4 transition-colors duration-300", ssid ? "text-hw-accent" : "text-white/30")} />
            </div>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Network Name (SSID)"
              className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4.5 pl-14 pr-4 text-sm font-mono transition-all outline-none placeholder:text-hw-secondary/30 focus:border-hw-accent/50 focus:bg-white/[0.08]"
            />
          </div>

          {encryption !== 'nopass' && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Lock className={cn("w-4 h-4 transition-colors duration-300", password ? "text-hw-accent" : "text-white/30")} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4.5 pl-14 pr-4 text-sm font-mono transition-all outline-none placeholder:text-hw-secondary/30 focus:border-hw-accent/50 focus:bg-white/[0.08]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-white mb-2 block pl-1">Security</label>
              <select
                value={encryption}
                onChange={(e) => setEncryption(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none focus:border-hw-accent/50 transition-all appearance-none"
              >
                <option value="WPA" className="bg-hw-bg text-white">WPA/WPA2/WPA3</option>
                <option value="WEP" className="bg-hw-bg text-white">WEP</option>
                <option value="nopass" className="bg-hw-bg text-white">None</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-white mb-2 block pl-1">Hidden Network</label>
              <button
                onClick={() => setIsHidden(!isHidden)}
                className={cn(
                  "w-full border rounded-xl py-3 px-4 text-xs font-mono transition-all flex items-center justify-center gap-2",
                  isHidden ? "bg-hw-accent/20 border-hw-accent text-hw-accent" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                )}
              >
                {isHidden ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 overflow-hidden"
        >
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 flex flex-col gap-4">
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
          <span className="text-[8px] font-mono text-hw-accent font-black uppercase">Auto_Connect</span>
        </div>

        <div id="wifi-generated-code" className="flex items-center justify-center min-h-[220px] min-w-[220px] relative z-10">
          <QRCodeSVG
            value={isValid ? finalQRValue : 'WIFI:S:Sample;T:WPA;P:Sample;;'}
            size={1024}
            style={{ width: 220, height: 220 }}
            level="H"
            includeMargin={false}
            fgColor={fgColor}
          />
        </div>

        {isValid && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            <button
              onClick={downloadCode}
              className="bg-hw-accent text-white px-6 py-4 rounded-[1.5rem] shadow-[0_15px_30px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95 transition-all glow-accent flex items-center gap-2 group-hover:rotate-1"
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                {Capacitor.isNativePlatform() ? 'Save to Gallery' : 'Download QR'}
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
