require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const unwrap = (value) => {
  if (value && typeof value === "object") {
    if (value.$oid) return value.$oid;
    if (value.$date) return new Date(value.$date);
  }
  return value;
};
const value = (row, key, fallback = null) => unwrap(row[key] ?? fallback);
const load = (folder, name) => JSON.parse(fs.readFileSync(path.join(folder, `${name}.json`), "utf8"));

async function main() {
  const folder = path.resolve(process.argv[2] || "mongo-export");
  const tables = [
    { file: "tours", table: "tours", fields: ["user_id", "plan", "description", "plan_start_date", "plan_end_date", "status"] },
    { file: "tour_members", table: "tour_members", fields: ["user_id", "tour_id", "name", "status"] },
    { file: "accounts", table: "accounts", fields: ["user_id", "tour_id", "type", "date", "collected_from", "amount", "reason", "members", "file", "status", "fileName"] },
  ];
  const client = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const item of tables) {
      const rows = load(folder, item.file);
      for (const row of rows) {
        const columns = ["id", ...item.fields, "created_at", "updated_at"];
        const values = [unwrap(row._id), ...item.fields.map((field) => value(row, field, field === "members" ? [] : null)), value(row, "createdAt", new Date()), value(row, "updatedAt", new Date())];
        const params = values.map((v, index) => item.fields[index - 1] === "members" ? JSON.stringify(v ?? []) : v);
        const placeholders = params.map((_, index) => `$${index + 1}${item.fields[index - 1] === "members" ? "::jsonb" : ""}`);
        const updates = columns.slice(1).map((column) => `"${column}" = EXCLUDED."${column}"`).join(", ");
        await client.query(`INSERT INTO "${item.table}" (${columns.map((column) => `"${column}"`).join(",")}) VALUES (${placeholders.join(",")}) ON CONFLICT (id) DO UPDATE SET ${updates}`, params);
      }
      console.log(`Imported ${rows.length} records into ${item.table}.`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error("Mongo export import failed:", error.message); process.exitCode = 1; });
