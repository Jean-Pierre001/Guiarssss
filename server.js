const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

// 🔐 CLAVE PRIVADA (solo servidor)
const PRIVATE_KEY = fs.readFileSync(
  path.join(__dirname, "private.pem"),
  "utf8"
);

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

// 🔐 base64url
function toBase64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 🔐 FIRMA RSA (SHA256)
function sign(text) {
  const signer = crypto.createSign("RSA-SHA256");

  // 🔥 IMPORTANTE: sin espacios extra
  signer.update(text, "utf8");
  signer.end();

  const signature = signer.sign(PRIVATE_KEY);

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
    <h2>Triskel QR</h2>

    <form action="/generate" method="POST">
      <textarea name="text" placeholder="Ej: Baño al frente"
        style="width:300px;height:80px;" required></textarea>

      <br><br>

      <select name="type">
        <option value="plain">QR Firmado (RSA)</option>
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
  let { text, type } = req.body;

  if (!text) return res.status(400).send("Texto requerido");

  // 🔥 NORMALIZAR (clave para que coincida con Flutter)
  text = text.trim();

  // 🔐 QR FIRMADO
  if (type === "plain") {
    const signature = sign(text);

    const content = `TRISKEL|${text}|${signature}`;

    return res.send(renderResult(content));
  }

  // 🌐 QR URL
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