import { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Type, QrCode, AlertTriangle, ShieldCheck, Upload, X, User, Mail, MessageSquare, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { isValidQR } from '../lib/security';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const PRESET_COLORS = ['#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

type GenMode = 'text' | 'vcard' | 'email' | 'sms' | 'geo';

export default function Generator() {
  const [mode, setMode] = useState<GenMode>('text');
  const [text, setText] = useState('https://scangen-pro.com');
  const [vcard, setVcard] = useState({ name: '', phone: '', email: '', org: '' });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [sms, setSms] = useState({ phone: '', body: '' });
  const [geo, setGeo] = useState({ lat: '', lng: '' });
  
  const [fgColor, setFgColor] = useState('#0A0A0B');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const finalQRValue = useMemo(() => {
    switch (mode) {
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.name}\nORG:${vcard.org}\nTEL:${vcard.phone}\nEMAIL:${vcard.email}\nEND:VCARD`;
      case 'email':
        return `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
      case 'sms':
        return `smsto:${sms.phone}:${sms.body}`;
      case 'geo':
        return `geo:${geo.lat},${geo.lng}`;
      default:
        const cleaned = text.trim();
        if (/^\+?[\d\s-]{7,15}$/.test(cleaned)) {
          return `tel:${cleaned.replace(/[\s-]/g, '')}`;
        }
        return cleaned;
    }
  }, [mode, text, vcard, email, sms, geo]);

  const isValid = useMemo(() => isValidQR(finalQRValue), [finalQRValue]);

  const autoLogoUrl = useMemo(() => {
    if (logoBase64) return logoBase64;
    return './logo.png';
  }, [logoBase64]);

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
              directory: Directory.Documents,
            });

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
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto relative z-10 pb-20">
      <div className="w-full space-y-4">
        {/* Mode Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {[
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'vcard', icon: User, label: 'Contact' },
            { id: 'email', icon: Mail, label: 'Email' },
            { id: 'sms', icon: MessageSquare, label: 'SMS' },
            { id: 'geo', icon: MapPin, label: 'Maps' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as GenMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-bold whitespace-nowrap transition-all",
                mode === item.id ? "bg-hw-accent text-white shadow-md" : "bg-white text-slate-500 border border-hw-border hover:bg-slate-50"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Inputs based on Mode */}
        <div className="space-y-3">
          {mode === 'text' && (
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter URL or text..."
              className="w-full bg-white border border-hw-border rounded-2xl py-4 px-5 text-sm font-sans focus:border-hw-accent outline-none shadow-sm"
            />
          )}

          {mode === 'vcard' && (
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="Full Name" value={vcard.name} onChange={(e) => setVcard({ ...vcard, name: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <input type="text" placeholder="Phone Number" value={vcard.phone} onChange={(e) => setVcard({ ...vcard, phone: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <input type="email" placeholder="Email Address" value={vcard.email} onChange={(e) => setVcard({ ...vcard, email: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <input type="text" placeholder="Organization" value={vcard.org} onChange={(e) => setVcard({ ...vcard, org: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
            </div>
          )}

          {mode === 'email' && (
            <div className="grid grid-cols-1 gap-3">
              <input type="email" placeholder="To" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <input type="text" placeholder="Subject" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <textarea placeholder="Message body" value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm h-24" />
            </div>
          )}

          {mode === 'sms' && (
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="Phone Number" value={sms.phone} onChange={(e) => setSms({ ...sms, phone: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <textarea placeholder="Message body" value={sms.body} onChange={(e) => setSms({ ...sms, body: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm h-24" />
            </div>
          )}

          {mode === 'geo' && (
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Latitude" value={geo.lat} onChange={(e) => setGeo({ ...geo, lat: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
              <input type="text" placeholder="Longitude" value={geo.lng} onChange={(e) => setGeo({ ...geo, lng: e.target.value })} className="bg-white border border-hw-border rounded-xl p-3 text-sm" />
            </div>
          )}
        </div>

        {/* Customization */}
        <div className="bg-slate-50 border border-hw-border rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">Custom Logo</p>
              <p className="text-[10px] text-slate-400">Add icon to center</p>
            </div>
            <div className="flex items-center gap-2">
              {logoBase64 && (
                <button onClick={removeLogo} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white border border-hw-border rounded-lg text-[10px] font-bold hover:bg-slate-50">
                {logoBase64 ? 'Change' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {PRESET_COLORS.map(color => (
              <button key={color} onClick={() => setFgColor(color)} className={cn("w-6 h-6 rounded-full border-2 transition-all", fgColor === color ? "border-slate-400 scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        layout
        className={cn(
          "relative p-8 bg-white rounded-3xl shadow-sm border border-hw-border transition-all duration-700",
          !isValid && "opacity-50 grayscale blur-[2px]"
        )}
      >
        <div id="generated-code" className="flex items-center justify-center min-h-[220px] min-w-[220px]">
          <QRCodeSVG
            value={finalQRValue || ' '}
            size={1024}
            style={{ width: 220, height: 220 }}
            level="H"
            includeMargin={true}
            fgColor={fgColor}
            imageSettings={autoLogoUrl ? { src: autoLogoUrl, height: 48, width: 48, excavate: true } : undefined}
          />
        </div>

        {isValid && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
            <button onClick={downloadCode} className="bg-hw-accent text-white px-6 py-3 rounded-xl shadow-md flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="text-xs font-bold">Save QR</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
