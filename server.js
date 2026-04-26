const express = require("express");
const nacl = require("tweetnacl");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// 🔐 CLAVES ED25519
// ===============================

const PUBLIC_KEY = "4qqeEnDKehK1k6iqZGUjp0Q7MYmMbhsizKzUZG8jho0=";

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
// 🏠 HOME (FIX “Cannot GET /”)
// ===============================
app.get("/", (req, res) => {
  res.send(`
  <html>
    <body style="background:#111;color:white;text-align:center;font-family:sans-serif;">
      <h2>TRISKEL QR SERVER</h2>
      <p>Ed25519 activo</p>

      <form method="POST" action="/generate">
        <input name="text" placeholder="user=123" style="padding:8px;width:200px" />
        <br><br>

        <button name="type" value="secure">Generar QR Seguro</button>
      </form>
    </body>
  </html>
  `);
});

// ===============================
// 🧠 GENERAR QR
// ===============================
app.post("/generate", (req, res) => {
  let { text, type } = req.body;

  if (!text) return res.status(400).send("Texto requerido");

  text = text.trim();

  // 🔐 QR SEGURO
  if (type === "secure") {
    const payload = `user=${text}`;

    const messageToSign = `TRISKEL.v1|${payload}`;
    const signature = sign(messageToSign);

    const qr = `TRISKEL.v1|${payload}|${signature}`;

    return res.send(render(qr));
  }

  return res.send(render("INVALID TYPE"));
});

// ===============================
// 🌐 QR VIEW
// ===============================
function render(content) {
  const encoded = encodeURIComponent(content);

  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;

  return `
  <html>
    <body style="background:#111;color:white;text-align:center;font-family:sans-serif;">
      <h3>QR generado</h3>

      <img src="${qrImage}" />

      <pre style="margin-top:20px;">${content}</pre>

      <br>
      <a href="/" style="color:#4af">Volver</a>
    </body>
  </html>
  `;
}

// ===============================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});