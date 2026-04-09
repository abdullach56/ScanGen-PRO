import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Download, Type, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function Generator() {
  const [text, setText] = useState('https://google.com');
  const [type, setType] = useState<'qr' | 'barcode'>('qr');

  const downloadCode = () => {
    const svg = document.getElementById('generated-code')?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${type}-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <div className="w-full space-y-4">
        <div className="flex bg-hw-bg/50 p-1 rounded-xl border border-hw-card/10">
          <button
            onClick={() => setType('qr')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all duration-200",
              type === 'qr' ? "bg-hw-card text-white shadow-lg" : "text-hw-secondary hover:text-hw-card"
            )}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">QR Code</span>
          </button>
          <button
            onClick={() => setType('barcode')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all duration-200",
              type === 'barcode' ? "bg-hw-card text-white shadow-lg" : "text-hw-secondary hover:text-hw-card"
            )}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Barcode</span>
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Type className="w-4 h-4 text-hw-secondary" />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL..."
            className="w-full bg-white border-2 border-hw-card/10 rounded-xl py-3 pl-12 pr-4 text-sm font-mono focus:border-hw-card focus:ring-0 transition-all outline-none"
          />
        </div>
      </div>

      <motion.div
        layout
        className="relative p-8 bg-white rounded-3xl shadow-xl border-4 border-hw-card group"
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
            <div className="scale-125">
              <Barcode 
                value={text || ' '} 
                width={1.5} 
                height={100} 
                fontSize={12}
                background="transparent"
              />
            </div>
          )}
        </div>

        <button
          onClick={downloadCode}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-hw-accent text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" />
        </button>
      </motion.div>

      <div className="text-center space-y-1 pt-4">
        <p className="text-xs font-mono text-hw-secondary uppercase tracking-tighter">Instant Generation</p>
        <p className="text-[10px] font-mono text-hw-secondary/60 uppercase">High resolution SVG output</p>
      </div>
    </div>
  );
}
