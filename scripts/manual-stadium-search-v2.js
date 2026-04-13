async function s(q) {
  try {
    const r = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchvenues.php?v=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (d.venues) {
      console.log(`${q}:`, d.venues.map(v => ({ id: v.idVenue, name: v.strVenue, location: v.strLocation })));
    } else {
      console.log(`${q}: not found`);
    }
  } catch (e) {
    console.error(q, "error", e.message);
  }
}

async function run() {
  await s("Dallas");
  await s("Arlington");
  await s("Santa Clara");
  await s("San Francisco");
  await s("Philadelphia");
  await s("Houston");
}

run();
