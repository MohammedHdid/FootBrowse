import { getDb } from './scripts/utils/db.js';
import { loadEnv } from './scripts/utils/env.js';
loadEnv();
async function main() {
  const db = getDb();
  const { data } = await db.from('leagues').select('name, api_id').eq('slug', 'premier-league').single();
  console.log(data);
}
main();
