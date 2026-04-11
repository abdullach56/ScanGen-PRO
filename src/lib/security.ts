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

  // Ensure it's a valid URL if it looks like one
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      new URL(trimmed);
      return trimmed;
    }
  } catch (e) {
    return null;
  }

  return trimmed;
};

export const isValidBarcode = (text: string, type: 'qr' | 'barcode'): boolean => {
  if (!text) return false;
  
  if (type === 'barcode') {
    // Basic barcode validation: most support alphanumeric, but some libraries crash on special chars
    // Allow standard alphanumeric and common symbols for Code128 etc.
    return /^[a-zA-Z0-9\s\-\.\$\/\+\%]+$/.test(text);
  }
  
  return text.length <= 2000; // QR limit safety
};
