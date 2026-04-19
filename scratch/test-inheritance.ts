import { execSync } from "node:child_process";
console.log("PARENT - NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
execSync("npx tsx -e \"console.log('CHILD - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)\"", { stdio: "inherit" });
