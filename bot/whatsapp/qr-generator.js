import chalk from 'chalk';
import QRCode from 'qrcode';

/**
 * Generate and display QR code as ASCII art
 */
export async function displayQRCode(qrData) {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.yellow('║                                                        ║'));
    console.log(chalk.yellow('║   Scan this QR Code with your WhatsApp phone:          ║'));
    console.log(chalk.yellow('║                                                        ║'));
    console.log(chalk.yellow('║   1. Open WhatsApp on your phone                       ║'));
    console.log(chalk.yellow('║   2. Go to Settings → Linked Devices                   ║'));
    console.log(chalk.yellow('║   3. Tap "Link a Device"                               ║'));
    console.log(chalk.yellow('║   4. Point camera at QR code below                     ║'));
    console.log(chalk.yellow('║                                                        ║'));
    console.log(chalk.yellow('╚════════════════════════════════════════════════════════╝'));
    
    // Display simple ASCII representation (placeholder)
    const asciiQR = generateASCIIQR(qrData);
    console.log(chalk.cyan(asciiQR));
    
    // Also save to file for reference
    console.log(chalk.green('\n✓ QR Code data: ' + qrData));
    console.log(chalk.green('✓ Waiting for WhatsApp authentication...\n'));

  } catch (error) {
    console.error(chalk.red('Error displaying QR code:', error.message));
  }
}

/**
 * Generate simple ASCII QR representation
 */
function generateASCIIQR(data) {
  const size = 21;
  const block = '█';
  const empty = ' ';
  
  // Create a simple pattern (this is a placeholder)
  let ascii = '\n';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      // Simple checkered pattern for visualization
      if ((i + j) % 2 === 0) {
        ascii += block;
      } else {
        ascii += empty;
      }
    }
    ascii += '\n';
  }
  
  return ascii;
}
