const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

// 🔐 CLAVES (DEBEN SER IGUALES EN FLUTTER)
const AES_KEY = crypto
  .createHash("sha256")
  .update("CLAVE_SUPER_SECRETA_TRISKEL_2026")
  .digest();

const HMAC_KEY = "OTRA_CLAVE_SECRETA_PARA_FIRMAS";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// UTILIDADES
// ===============================

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

// base64url
function toBase64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// AES-256-CBC
function encrypt(text) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);

  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(encrypted),
  };
}

// HMAC SHA256
function sign(data) {
  return toBase64Url(
    crypto.createHmac("sha256", HMAC_KEY).update(data).digest()
  );
}

// ===============================
// RUTAS
// ===============================

// HOME
app.get("/", (req, res) => {
  res.send(`
  <html>
  <body style="background:#111;color:#fff;text-align:center;font-family:sans-serif;">
    <h2>Triskel QR</h2>

    <form action="/generate" method="POST">
      <textarea name="text" placeholder="Ej: Baño al frente"
        style="width:300px;height:80px;" required></textarea>

      <br><br>

      <select name="type">
        <option value="plain">QR Seguro (AES + HMAC)</option>
        <option value="smart">QR URL</option>
      </select>

      <br><br>
      <button type="submit">Generar</button>
    </form>
  </body>
  </html>
  `);
});

// GENERAR QR
app.post("/generate", (req, res) => {
  const { text, type } = req.body;

  if (!text) return res.status(400).send("Texto requerido");

  // 🔐 QR SEGURO
  if (type === "plain") {
    // IMPORTANTE: incluir prefijo antes de cifrar
    const encrypted = encrypt("TRISKEL|" + text);

    const payload = `${encrypted.iv}|${encrypted.ciphertext}`;
    const signature = sign(payload);

    const content = `TRISKEL|${encrypted.iv}|${encrypted.ciphertext}|${signature}`;

    return res.send(renderResult(content));
  }

  // 🌐 QR INTELIGENTE
  const data = loadData();
  const id = generateId();

  data[id] = { text };
  saveData(data);

  const url = `https://${req.get("host")}/qr/${id}`;
  return res.send(renderResult(url));
});

// API
app.get("/qr/:id", (req, res) => {
  const data = loadData();
  const item = data[req.params.id];

  if (!item) {
    return res.status(404).json({ error: "No encontrado" });
  }

  res.json({ text: item.text });
});

// HTML RESULTADO
function renderResult(content) {
  const encoded = encodeURIComponent(content);
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;

  return `
  <html>
  <body style="background:#111;color:#fff;text-align:center;font-family:sans-serif;">
    <h3>QR generado</h3>
    <img src="${qrImage}" />
    <pre>${content}</pre>
    <br><a href="/">Volver</a>
  </body>
  </html>
  `;
}

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});