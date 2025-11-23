import express from "express";
import cors from "cors";
import { config } from "./config";
import schemaRoutes from "./routes/schemaRoutes";
import chatRoutes from "./routes/chatRoutes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_, res) => {
  res.json({ status: "ok", service: "sqlchat-llama-backend" });
});

app.use("/schema", schemaRoutes);
app.use("/chat", chatRoutes);

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

