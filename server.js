const express = require("express");
const fs = require("fs");
const path = require("path");
const nacl = require("tweetnacl");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// 🔐 CLAVES ED25519
// ===============================

// PUBLIC (Flutter)
const PUBLIC_KEY = "4qqeEnDKehK1k6iqZGUjp0Q7MYmMbhsizKzUZG8jho0=";

// PRIVATE (server only)
const PRIVATE_KEY = "NJOOHUlM8xC//6OjVx+DS83ZUTSevaBx50HefnkkOeziqp4ScMp6ErWTqKpkZSOnRDsxiYxuGyLMrNRkbyOGjQ==";

function b64ToBytes(b64) {
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

const privateKeyBytes = b64ToBytes(PRIVATE_KEY);

// ===============================
// 🔐 BASE64URL
// ===============================
function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ===============================
// 🔐 SIGN ED25519
// ===============================
function sign(text) {
  const message = Buffer.from(text, "utf8");
  const signature = nacl.sign.detached(message, privateKeyBytes);
  return toBase64Url(signature);
}

// ===============================
// 🧠 QR GENERATION
// ===============================
app.post("/generate", (req, res) => {
  let { text, type } = req.body;

  if (!text) return res.status(400).send("Texto requerido");

  text = text.trim();

  if (type === "secure") {
    const payload = `user=${text}`; // puedes cambiar estructura aquí

    const messageToSign = `TRISKEL.v1|${payload}`;
    const signature = sign(messageToSign);

    const qr = `TRISKEL.v1|${payload}|${signature}`;

    return res.send(render(qr));
  }

  return res.send(render("INVALID TYPE"));
});

// ===============================
// 🌐 UI SIMPLE
// ===============================
function render(content) {
  const encoded = encodeURIComponent(content);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;

  return `
  <html>
  <body style="background:#111;color:white;text-align:center;font-family:sans-serif;">
    <h3>QR generado</h3>
    <img src="${qr}" />
    <pre>${content}</pre>
  </body>
  </html>
  `;
}

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});