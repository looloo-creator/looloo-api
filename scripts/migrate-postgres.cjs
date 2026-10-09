require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false,
  });
  await client.connect();
  try {
    const migrationsDir = path.join(__dirname, "../migrations");
    const mode = process.argv[2] || "core";
    const available = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
    const migrations = mode === "all"
      ? available
      : available.filter((file) => mode === "rag" ? file.startsWith("002_") : file.startsWith("001_"));
    if (!migrations.length) throw new Error(`No PostgreSQL migrations found for mode: ${mode}`);
    for (const file of migrations) {
      await client.query("BEGIN");
      try {
        await client.query(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
        await client.query("COMMIT");
        console.log(`Applied ${file}.`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log(mode === "rag" ? "PostgreSQL pgvector RAG schema is ready." : "PostgreSQL core schema is ready.");
  } catch (error) {
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("PostgreSQL migration failed:", error.message);
  process.exitCode = 1;
});
