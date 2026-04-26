const express = require("express");
const fs = require("fs");
const path = require("path");
const nacl = require("tweetnacl");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// 🔐 CLAVES ED25519
// ===============================

// PUBLIC (Flutter la usa)
const PUBLIC_KEY = "4qqeEnDKehK1k6iqZGUjp0Q7MYmMbhsizKzUZG8jho0=";

// PRIVATE (solo server)
const PRIVATE_KEY = "NJOOHUlM8xC//6OjVx+DS83ZUTSevaBx50HefnkkOeziqp4ScMp6ErWTqKpkZSOnRDsxiYxuGyLMrNRkbyOGjQ==";

// convert base64 -> Uint8Array
function b64ToUint8(b64) {
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

const privateKeyBytes = b64ToUint8(PRIVATE_KEY);

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
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ===============================
// 🔐 ED25519 SIGN
// ===============================

function sign(text) {
  const message = Buffer.from(text, "utf8");

  const signature = nacl.sign.detached(message, privateKeyBytes);

  return toBase64Url(signature);
}

// ===============================
// RUTAS
// ===============================

// HOME
app.get("/", (req, res) => {
  res.send(`
  <html>
  <body style="background:#111;color:#fff;text-align:center;font-family:sans-serif;">
    <h2>Triskel QR (Ed25519)</h2>

    <form action="/generate" method="POST">
      <textarea name="text" placeholder="Ej: user=12;exp=1710000000"
        style="width:300px;height:80px;" required></textarea>

      <br><br>

      <select name="type">
        <option value="secure">QR Seguro (Ed25519)</option>
        <option value="url">QR URL</option>
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
  let { text, type } = req.body;

  if (!text) return res.status(400).send("Texto requerido");

  text = text.trim();

  // ===============================
  // 🔐 QR SEGURO ED25519
  // ===============================
  if (type === "secure") {
    const payload = `TRISKEL.v1|${text}`;
    const signature = sign(payload);

    const content = `${payload}|${signature}`;

    return res.send(renderResult(content));
  }

  // ===============================
  // 🌐 QR URL
  // ===============================
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