const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

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

// Crear QR
app.post("/generate", (req, res) => {
  const { text, type } = req.body;

  if (!text) {
    return res.status(400).send("Texto requerido");
  }

  if (type === "plain") {
    const content = "TRISKEL|" + text;
    return res.send(renderResult(content));
  }

  const data = loadData();
  const id = generateId();

  data[id] = { text };
  saveData(data);

  const url = `${req.protocol}://${req.get("host")}/qr/${id}`;
  return res.send(renderResult(url));
});

// Obtener QR
app.get("/qr/:id", (req, res) => {
  const data = loadData();
  const item = data[req.params.id];

  if (!item) {
    return res.status(404).json({ error: "No encontrado" });
  }

  res.json({ text: item.text });
});

// HTML resultado
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