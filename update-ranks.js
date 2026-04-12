const fs = require('fs');

const ranksCSV = fs.readFileSync('./ranks.csv', 'utf8');
const lines = ranksCSV.split('\n').slice(1); // skip header
const rankMap = {};

const aliases = {
  "IR Iran": "Iran",
  "Türkiye": "Turkey",
  "Korea Republic": "South Korea",
  "Czechia": "Czech Republic",
  "Côte d'Ivoire": "Ivory Coast",
  "Congo DR": "DR Congo",
  "USA": "USA",
  "Republic of Ireland": "Ireland",
  "Korea DPR": "North Korea",
  "Cabo Verde": "Cape Verde"
};

lines.forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(',');
  const rank = parseInt(parts[0]);
  const country = parts[1].trim();
  
  rankMap[country] = rank;
  if (aliases[country]) {
    rankMap[aliases[country]] = rank;
  }
});

const teams = JSON.parse(fs.readFileSync('./data/teams.json', 'utf8'));
let teamsUpdated = 0;
teams.forEach(team => {
  if (rankMap[team.name]) {
    team.fifa_rank = rankMap[team.name];
    teamsUpdated++;
  } else {
    // try aliases
    if (team.name === "United States" && rankMap["USA"]) team.fifa_rank = rankMap["USA"];
  }
});
fs.writeFileSync('./data/teams.json', JSON.stringify(teams, null, 2) + '\n');
console.log(`Updated ranks for ${teamsUpdated} teams in teams.json`);

const matches = JSON.parse(fs.readFileSync('./data/matches.json', 'utf8'));
let matchesUpdated = 0;
matches.forEach(match => {
  if (match.team_a && match.team_a.name) {
      let rA = rankMap[match.team_a.name];
      if (!rA && match.team_a.name === "USA") rA = rankMap["USA"];
      if (rA) match.team_a.fifa_rank = rA;
  }
  if (match.team_b && match.team_b.name) {
      let rB = rankMap[match.team_b.name];
      if (!rB && match.team_b.name === "USA") rB = rankMap["USA"];
      if (rB) match.team_b.fifa_rank = rB;
  }
});
fs.writeFileSync('./data/matches.json', JSON.stringify(matches, null, 2) + '\n');
console.log(`Updated ranks in matches.json`);
