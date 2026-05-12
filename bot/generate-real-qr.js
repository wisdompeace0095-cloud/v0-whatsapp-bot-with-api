import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate a real scannable QR code image
 */
export async function generateQRCodeImage(text, filename = 'qr-code.png') {
  try {
    const filepath = path.join(__dirname, '..', filename);
    
    // Generate QR code as PNG
    await QRCode.toFile(filepath, text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 500,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log(`✓ QR Code generated: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataURL(text) {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 500,
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw error;
  }
}
