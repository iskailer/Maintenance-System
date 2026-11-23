const express = require("express");
const cors = require("cors");
const equipmentRoutes = require("./routes/equipmentRoutes");

const app = express();

// Origens permitidas: lista fixa do Live Server mais as de CORS_ORIGINS (separadas por vírgula).
const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    ...(process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.use("/equipments", equipmentRoutes);

// Rota não encontrada.
app.use((req, res) => {
    res.status(404).json({ message: "Rota não encontrada." });
});

// Tratamento global de erros.
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "JSON inválido na requisição." });
    }
    console.error("Erro não tratado:", err);
    res.status(500).json({ message: "Erro interno do servidor." });
});

module.exports = app;
