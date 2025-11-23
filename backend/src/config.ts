import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mssql: {
    server: process.env.MSSQL_SERVER || "localhost",
    port: Number(process.env.MSSQL_PORT || 1433),
    user: process.env.MSSQL_USER || "sa",
    password: process.env.MSSQL_PASSWORD || "",
    database: process.env.MSSQL_DB || "",
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3"
  }
};
