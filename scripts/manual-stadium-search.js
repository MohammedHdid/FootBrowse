async function s(q) {
  try {
    const r = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchvenues.php?v=${encodeURIComponent(q)}`);
    const d = await r.json();
    console.log(q, d.venues ? d.venues.map(v => ({ id: v.idVenue, name: v.strVenue })) : "not found");
  } catch (e) {
    console.error(q, "error", e.message);
  }
}

async function run() {
  await s("AT&T Stadium");
  await s("Estadio Azteca");
  await s("BC Place");
  await s("Levi's Stadium");
  await s("Estadio Akron");
  await s("Estadio BBVA");
  await s("MetLife Stadium");
}

run();
