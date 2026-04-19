async function s(t1, t2) {
  try {
    const q = `${t1}_vs_${t2}`;
    const r = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchevents.php?e=${encodeURIComponent(q)}`);
    const d = await r.json();
    console.log(`--- ${t1} vs ${t2} ---`);
    if (d.event) {
      console.log(`Found ${d.event.length} match(es).`);
      d.event.slice(0, 3).forEach(e => {
        console.log(`  ${e.strEvent} | ${e.dateEvent} | ${e.intHomeScore}-${e.intAwayScore} | ${e.strLeague}`);
      });
    } else {
      console.log('  No matches found.');
    }
  } catch (e) {
    console.error(t1, t2, "error", e.message);
  }
}

async function run() {
  await s("Brazil", "Morocco");
  await s("England", "Brazil");
  await s("Mexico", "USA");
  await s("France", "Germany");
}

run();
