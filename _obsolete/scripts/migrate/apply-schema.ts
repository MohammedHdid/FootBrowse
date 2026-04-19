import fs from "node:fs";
import path from "node:path";

const ACCESS_TOKEN = "sbp_03af75f86dd01f660d2d1e12de015797d2f78140";
const PROJECT_REF  = "ulriptdnuacjdlpcifr";
const API_BASE     = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function runQuery(sql: string): Promise<void> {
  const res = await fetch(API_BASE, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
}

async function main() {
  const sqlFile = path.join(process.cwd(), "supabase", "migrations", "001_schema.sql");
  const raw = fs.readFileSync(sqlFile, "utf-8");

  // Split on semicolons, skip blank lines and comment-only blocks
  const statements = raw
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(--.*)$/.test(s));

  console.log(`Running ${statements.length} SQL statements…`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 60).replace(/\n/g, " ");
    try {
      await runQuery(stmt);
      console.log(`  ✅ ${i + 1}/${statements.length}: ${preview}`);
    } catch (err: any) {
      // "already exists" errors are safe to ignore
      if (err.message.includes("already exists")) {
        console.log(`  ⚠️  ${i + 1}/${statements.length}: already exists — skipped`);
      } else {
        console.error(`  ❌ ${i + 1}/${statements.length}: ${preview}`);
        console.error(`     ${err.message}`);
      }
    }
  }

  console.log("\n✅ Schema applied.");
}

main().catch((e) => { console.error(e); process.exit(1); });
