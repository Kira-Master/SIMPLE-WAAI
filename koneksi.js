import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config()
const genAI = new GoogleGenerativeAI(process.env.API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
import qr from 'qrcode-terminal';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,  // Ini akan menampilkan pairing code di terminal
        getMessage: async (key) => {
            // Implement your message fetching logic here
            return { conversation: 'Hello' };
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Connected');
        }

        if (qr) {
            console.log(`Scan QR with WhatsApp: ${qr}`);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const text = msg.message.conversation || '';
    console.log('Received message:', text); // Tambahkan logging

    try {
    const mmk = await model.generateContent(text)
    let hasil = mmk.response.text()
    if (hasil) {
      await sock.sendMessage(msg.key.remoteJid, { text: hasil });
    } else {
      console.log('Received empty or undefined response from AI.');
    }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});
}
startBot();
