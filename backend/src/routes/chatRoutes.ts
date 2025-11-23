import { Router } from "express";
import { buildSystemPrompt } from "../services/promptBuilder";
import { llamaChat } from "../services/ollamaClient";
import { basicSqlSafetyCheck } from "../services/sqlValidator";
import { runQuery } from "../services/dbClient";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const systemPrompt = buildSystemPrompt();

    const raw = await llamaChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]);

    const parsed = JSON.parse(raw);
    basicSqlSafetyCheck(parsed.sql);

    const result = await runQuery(parsed.sql);

    res.json({
      sql: parsed.sql,
      analysis: parsed.analysis,
      result
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
