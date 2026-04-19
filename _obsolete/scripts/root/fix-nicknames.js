const fs = require("fs");
const t = JSON.parse(fs.readFileSync("./data/teams.json", "utf-8"));

const fixes = {
  "morocco": "Les Lions de l'Atlas",
  "saudi-arabia": "Al-Akhdar (The Green)",
};

let c = 0;
t.forEach((x) => {
  if (fixes[x.slug]) {
    x.nickname = fixes[x.slug];
    c++;
  }
});

fs.writeFileSync("./data/teams.json", JSON.stringify(t, null, 2));
console.log("Fixed", c, "nicknames");
