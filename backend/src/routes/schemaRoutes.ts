import { Router } from "express";
import { loadSchemaFromDb } from "../services/schemaLoader";
import { setSchema, getSchema } from "../services/schemaStore";

const router = Router();

router.post("/refresh", async (_, res) => {
  try {
    const schema = await loadSchemaFromDb();
    setSchema(schema);
    res.json({ success: true, schema });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", (req, res) => {
  const schema = getSchema();
  if (!schema) return res.status(404).json({ error: "Schema not loaded" });
  res.json({ schema });
});

export default router;
