import dotenv from 'dotenv';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';

dotenv.config();

console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
console.log(chalk.blue.bold('║     Mozosubz WhatsApp AI Bot - QR Code Scanner         ║'));
console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

console.log(chalk.yellow('📱 IMPORTANT: QR CODE SCANNING INSTRUCTIONS'));
console.log(chalk.yellow('═════════════════════════════════════════════\n'));

console.log(chalk.white('1. A QR code will appear below in the terminal'));
console.log(chalk.white('2. Open WhatsApp on your phone'));
console.log(chalk.white('3. Go to: Settings → Linked Devices → Link a Device'));
console.log(chalk.white('4. Point your phone\'s camera at the QR code below'));
console.log(chalk.white('5. Confirm on your phone to authenticate'));
console.log(chalk.white('6. Once authenticated, the bot will be ready!\n'));

console.log(chalk.cyan('Generating QR code...\n'));

const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

let qrCodeReceived = false;

client.on('qr', (qr) => {
  if (!qrCodeReceived) {
    qrCodeReceived = true;
    console.log(chalk.green('✅ QR Code generated! Scan it with your WhatsApp:\n'));
    qrcode.generate(qr, { small: true });
    console.log(chalk.yellow('\n⏳ Waiting for you to scan...\n'));
  }
});

client.on('ready', () => {
  console.log(chalk.green.bold('\n✅ WhatsApp Authentication Successful!\n'));
  console.log(chalk.blue('Bot is now connected and ready to receive messages!'));
  console.log(chalk.blue('You can send messages to the bot via WhatsApp.\n'));
});

client.on('authenticated', () => {
  console.log(chalk.green('✅ Authenticated!\n'));
});

client.on('auth_failure', (msg) => {
  console.log(chalk.red('❌ Authentication failed:', msg));
});

client.on('disconnected', (reason) => {
  console.log(chalk.yellow('⚠️  Client was disconnected:', reason));
});

client.on('message', async (msg) => {
  console.log(chalk.cyan(`\n📨 Received message from ${msg.from}:`));
  console.log(chalk.white(`   "${msg.body}"\n`));
});

client.initialize();

console.log(chalk.yellow('⏳ Initializing WhatsApp client...\n'));
