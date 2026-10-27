const app = require("./src/app");
const cors = require('cors');

app.use(cors({
    origin: ['http://127.0.0.1:5500',
    'http://localhost:5500'],
    methods: ["GET", "POST","PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

const PORT = 3000;

app.listen(PORT, () =>{
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
