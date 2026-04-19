import { execSync } from "node:child_process";
import path from "node:path";

const scripts = [
  "01-seed-leagues.ts",
  "02-seed-venues.ts",
  "03-seed-teams.ts",
  "04-seed-fixtures.ts",
  "05-seed-players.ts",
  "06-seed-standings.ts",
  "07-seed-events.ts",
  "08-seed-predictions-odds.ts",
];

const dir = path.join(process.cwd(), "scripts", "migrate");

for (const script of scripts) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`▶  ${script}`);
  console.log("─".repeat(50));
  execSync(`tsx ${path.join(dir, script)}`, { stdio: "inherit" });
}

console.log("\n✅  All seeds complete.");
