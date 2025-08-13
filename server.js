import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { solicitarAjustes } from "./api/SAjuste.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post("/api/SAjustes", solicitarAjustes);

app.get("/", (req, res) => {
  res.send("Servidor backend está rodando!");
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
