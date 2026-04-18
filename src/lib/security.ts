/**
 * Security utilities for ScanOQRs Pro
 */

export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  const trimmed = url.trim();
  
  // Prevent javascript: and other dangerous schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousSchemes.some(scheme => trimmed.toLowerCase().startsWith(scheme))) {
    return null;
  }

  // Ensure it's a valid URL or a known app scheme
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch (e) {
      return null;
    }
  }

  // Allow custom schemes if they follow the pattern scheme:// or scheme: (like mailto:)
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed.toLowerCase())) {
     return trimmed;
  }

  return trimmed;
};

export const isLink = (text: string): boolean => {
  if (!text) return false;
  const lowered = text.toLowerCase().trim();
  
  // Standard web links
  if (lowered.startsWith('http://') || lowered.startsWith('https://')) return true;
  
  // Common payment and app schemes
  const appSchemes = [
    'upi:', 'paytm:', 'phonepe:', 'venmo:', 'paypal:', 'paze:', 
    'mailto:', 'tel:', 'sms:', 'whatsapp:', 'geo:', 'intent:'
  ];
  
  return appSchemes.some(scheme => lowered.startsWith(scheme));
};

export const isValidBarcode = (text: string, type: 'qr' | 'barcode'): boolean => {
  if (!text) return false;
  
  if (type === 'barcode') {
    return /^[a-zA-Z0-9\s\-\.\$\/\+\%]+$/.test(text);
  }
  
  return text.length <= 2000;
};

