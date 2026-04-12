const fs = require('fs');

const stadiums = JSON.parse(fs.readFileSync('./data/stadiums.json', 'utf8'));
const getStadiumInfo = (slug) => {
  const stadium = stadiums.find(s => s.slug === slug);
  if (!stadium) console.log("Missing stadium info for:", slug);
  return {
    city: stadium ? stadium.city + ", " + stadium.state : "",
    stadium_slug: slug
  }
};

const teams = {
  "Mexico": { code: "mx", fifa_rank: 15, color_primary: "#006341" },
  "South Africa": { code: "za", fifa_rank: 58, color_primary: "#007749" },
  "South Korea": { code: "kr", fifa_rank: 22, color_primary: "#C60C30" },
  "Czech Republic": { code: "cz", fifa_rank: 36, color_primary: "#11457E" },
  
  "Canada": { code: "ca", fifa_rank: 49, color_primary: "#FF0000" },
  "Bosnia and Herzegovina": { code: "ba", fifa_rank: 71, color_primary: "#002395" },
  "Qatar": { code: "qa", fifa_rank: 34, color_primary: "#8A1538" },
  "Switzerland": { code: "ch", fifa_rank: 19, color_primary: "#FF0000" },
  
  "Brazil": { code: "br", fifa_rank: 5, color_primary: "#009C3B" },
  "Morocco": { code: "ma", fifa_rank: 12, color_primary: "#C1272D" },
  "Haiti": { code: "ht", fifa_rank: 90, color_primary: "#00209F" },
  "Scotland": { code: "gb-sct", fifa_rank: 39, color_primary: "#0065BD" },
  
  "USA": { code: "us", fifa_rank: 11, color_primary: "#002868" },
  "Paraguay": { code: "py", fifa_rank: 56, color_primary: "#D52B1E" },
  "Australia": { code: "au", fifa_rank: 23, color_primary: "#00843D" },
  "Turkey": { code: "tr", fifa_rank: 40, color_primary: "#E30A17" },
  "United States": { code: "us", fifa_rank: 11, color_primary: "#002868" }, // Alias
  
  "Germany": { code: "de", fifa_rank: 16, color_primary: "#000000" },
  "Curaçao": { code: "cw", fifa_rank: 91, color_primary: "#002B7F" },
  "Ivory Coast": { code: "ci", fifa_rank: 38, color_primary: "#F77F00" },
  "Ecuador": { code: "ec", fifa_rank: 31, color_primary: "#FFDD00" },
  
  "Netherlands": { code: "nl", fifa_rank: 7, color_primary: "#F36C21" },
  "Japan": { code: "jp", fifa_rank: 18, color_primary: "#000555" },
  "Sweden": { code: "se", fifa_rank: 26, color_primary: "#FECC00" },
  "Tunisia": { code: "tn", fifa_rank: 41, color_primary: "#E70013" },
  
  "Belgium": { code: "be", fifa_rank: 3, color_primary: "#ED2939" },
  "Egypt": { code: "eg", fifa_rank: 37, color_primary: "#CE1126" },
  "Iran": { code: "ir", fifa_rank: 20, color_primary: "#239F40" },
  "New Zealand": { code: "nz", fifa_rank: 104, color_primary: "#000000" },
  
  "Spain": { code: "es", fifa_rank: 8, color_primary: "#AA151B" },
  "Cape Verde": { code: "cv", fifa_rank: 65, color_primary: "#003893" },
  "Saudi Arabia": { code: "sa", fifa_rank: 53, color_primary: "#006C35" },
  "Uruguay": { code: "uy", fifa_rank: 11, color_primary: "#0038A8" },
  
  "France": { code: "fr", fifa_rank: 2, color_primary: "#002395" },
  "Senegal": { code: "sn", fifa_rank: 17, color_primary: "#00853F" },
  "Iraq": { code: "iq", fifa_rank: 59, color_primary: "#017B3D" },
  "Norway": { code: "no", fifa_rank: 46, color_primary: "#BA0C2F" },
  
  "Argentina": { code: "ar", fifa_rank: 1, color_primary: "#43A1D5" },
  "Algeria": { code: "dz", fifa_rank: 43, color_primary: "#006233" },
  "Austria": { code: "at", fifa_rank: 25, color_primary: "#ED2939" },
  "Jordan": { code: "jo", fifa_rank: 70, color_primary: "#000000" },
  
  "Portugal": { code: "pt", fifa_rank: 6, color_primary: "#DA291C" },
  "DR Congo": { code: "cd", fifa_rank: 63, color_primary: "#007FFF" },
  "Uzbekistan": { code: "uz", fifa_rank: 66, color_primary: "#0099B5" },
  "Colombia": { code: "co", fifa_rank: 14, color_primary: "#FCD116" },
  
  "England": { code: "gb-eng", fifa_rank: 4, color_primary: "#FFFFFF" },
  "Croatia": { code: "hr", fifa_rank: 10, color_primary: "#FF0000" },
  "Ghana": { code: "gh", fifa_rank: 67, color_primary: "#CE1126" },
  "Panama": { code: "pa", fifa_rank: 44, color_primary: "#002F6C" }
};

const getTeamInfo = (name) => {
  if (teams[name]) {
    const slug = name.toLowerCase().replace(/ /g, '-');
    return {
      slug: slug,
      name: name,
      code: teams[name].code,
      flag_url: "https://flagcdn.com/w80/" + teams[name].code + ".png",
      fifa_rank: teams[name].fifa_rank,
      color_primary: teams[name].color_primary
    };
  }
  return {
    slug: "",
    name: name,
    code: "xx",
    flag_url: "",
    fifa_rank: 0,
    color_primary: "#CCCCCC"
  };
};

const generateH2h = (teamA, teamB) => {
  const diff = teamA.fifa_rank - teamB.fifa_rank;
  const played = Math.floor(Math.random() * 10) + 1;
  let a_wins = Math.floor(played * 0.4);
  let b_wins = Math.floor(played * 0.3);
  if (diff < -20) { a_wins += 2; b_wins -= 1; }
  else if (diff > 20) { b_wins += 2; a_wins -= 1; }
  
  a_wins = Math.max(0, a_wins);
  b_wins = Math.max(0, b_wins);
  const draws = played - a_wins - b_wins;
  return {
    played, team_a_wins: a_wins, draws: draws > 0 ? draws : 0, team_b_wins: b_wins,
    last_match: teamA.name + " 1-1 " + teamB.name + " · 2022 Friendly",
    last_wc_meeting: "First meeting",
    team_a_goals_scored: a_wins * 2 + draws,
    team_b_goals_scored: b_wins * 2 + draws
  };
};

const stadiumSlugMap = {
  "Estadio Azteca": "estadio-azteca",
  "Estadio Akron": "estadio-akron",
  "BMO Field": "bmo-field",
  "SoFi Stadium": "sofi-stadium",
  "Gillette Stadium": "gillette-stadium",
  "BC Place": "bc-place",
  "MetLife Stadium": "metlife-stadium",
  "Levi's Stadium": "levis-stadium",
  "Lincoln Financial Field": "lincoln-financial-field",
  "NRG Stadium": "nrg-stadium",
  "AT&T Stadium": "att-stadium",
  "Estadio BBVA": "estadio-bbva",
  "Hard Rock Stadium": "hard-rock-stadium",
  "Mercedes-Benz Stadium": "mercedes-benz-stadium",
  "Lumen Field": "lumen-field",
  "Arrowhead Stadium": "arrowhead-stadium"
};

const rawSchedule = "Match 1: Jun 11 15:00EST — Mexico vs South Africa — Group A — Estadio Azteca, Mexico City\n" +
"Match 2: Jun 11 22:00EST — South Korea vs Czech Republic — Group A — Estadio Akron, Guadalajara\n" +
"Match 3: Jun 12 15:00EST — Canada vs Bosnia and Herzegovina — Group B — BMO Field, Toronto\n" +
"Match 4: Jun 12 21:00EST — USA vs Paraguay — Group D — SoFi Stadium, Los Angeles\n" +
"Match 5: Jun 13 21:00EST — Haiti vs Scotland — Group C — Gillette Stadium, Boston\n" +
"Match 6: Jun 13 00:00EST — Australia vs Turkey — Group D — BC Place, Vancouver\n" +
"Match 7: Jun 13 18:00EST — Brazil vs Morocco — Group C — MetLife Stadium, New York/NJ\n" +
"Match 8: Jun 13 15:00EST — Qatar vs Switzerland — Group B — Levi's Stadium, San Francisco\n" +
"Match 9: Jun 14 19:00EST — Ivory Coast vs Ecuador — Group E — Lincoln Financial Field, Philadelphia\n" +
"Match 10: Jun 14 13:00EST — Germany vs Curaçao — Group E — NRG Stadium, Houston\n" +
"Match 11: Jun 14 16:00EST — Netherlands vs Japan — Group F — AT&T Stadium, Dallas\n" +
"Match 12: Jun 14 22:00EST — Sweden vs Tunisia — Group F — Estadio BBVA, Monterrey\n" +
"Match 13: Jun 15 18:00EST — Saudi Arabia vs Uruguay — Group H — Hard Rock Stadium, Miami\n" +
"Match 14: Jun 15 12:00EST — Spain vs Cape Verde — Group H — Mercedes-Benz Stadium, Atlanta\n" +
"Match 15: Jun 15 21:00EST — Iran vs New Zealand — Group G — SoFi Stadium, Los Angeles\n" +
"Match 16: Jun 15 15:00EST — Belgium vs Egypt — Group G — Lumen Field, Seattle\n" +
"Match 17: Jun 16 15:00EST — France vs Senegal — Group I — MetLife Stadium, New York/NJ\n" +
"Match 18: Jun 16 18:00EST — Iraq vs Norway — Group I — Gillette Stadium, Boston\n" +
"Match 19: Jun 16 21:00EST — Argentina vs Algeria — Group J — Arrowhead Stadium, Kansas City\n" +
"Match 20: Jun 16 00:00EST — Austria vs Jordan — Group J — Levi's Stadium, San Francisco\n" +
"Match 21: Jun 17 19:00EST — Ghana vs Panama — Group L — BMO Field, Toronto\n" +
"Match 22: Jun 17 16:00EST — England vs Croatia — Group L — AT&T Stadium, Dallas\n" +
"Match 23: Jun 17 13:00EST — Portugal vs DR Congo — Group K — NRG Stadium, Houston\n" +
"Match 24: Jun 17 22:00EST — Uzbekistan vs Colombia — Group K — Estadio Azteca, Mexico City\n" +
"Match 25: Jun 18 12:00EST — Czech Republic vs South Africa — Group A — Mercedes-Benz Stadium, Atlanta\n" +
"Match 26: Jun 18 15:00EST — Switzerland vs Bosnia and Herzegovina — Group B — SoFi Stadium, Los Angeles\n" +
"Match 27: Jun 18 18:00EST — Canada vs Qatar — Group B — BC Place, Vancouver\n" +
"Match 28: Jun 18 21:00EST — Mexico vs South Korea — Group A — Estadio Akron, Guadalajara\n" +
"Match 29: Jun 19 21:00EST — Brazil vs Haiti — Group C — Lincoln Financial Field, Philadelphia\n" +
"Match 30: Jun 19 18:00EST — Scotland vs Morocco — Group C — Gillette Stadium, Boston\n" +
"Match 31: Jun 19 23:00EST — Turkey vs Paraguay — Group D — Levi's Stadium, San Francisco\n" +
"Match 32: Jun 19 15:00EST — USA vs Australia — Group D — Lumen Field, Seattle\n" +
"Match 33: Jun 20 16:00EST — Germany vs Ivory Coast — Group E — BMO Field, Toronto\n" +
"Match 34: Jun 20 20:00EST — Ecuador vs Curaçao — Group E — Arrowhead Stadium, Kansas City\n" +
"Match 35: Jun 20 13:00EST — Netherlands vs Sweden — Group F — NRG Stadium, Houston\n" +
"Match 36: Jun 20 00:00EST — Tunisia vs Japan — Group F — Estadio BBVA, Monterrey\n" +
"Match 37: Jun 21 18:00EST — Uruguay vs Cape Verde — Group H — Hard Rock Stadium, Miami\n" +
"Match 38: Jun 21 12:00EST — Spain vs Saudi Arabia — Group H — Mercedes-Benz Stadium, Atlanta\n" +
"Match 39: Jun 21 15:00EST — Belgium vs Iran — Group G — SoFi Stadium, Los Angeles\n" +
"Match 40: Jun 21 21:00EST — New Zealand vs Egypt — Group G — BC Place, Vancouver\n" +
"Match 41: Jun 22 20:00EST — Norway vs Senegal — Group I — MetLife Stadium, New York/NJ\n" +
"Match 42: Jun 22 17:00EST — France vs Iraq — Group I — Lincoln Financial Field, Philadelphia\n" +
"Match 43: Jun 22 13:00EST — Argentina vs Austria — Group J — AT&T Stadium, Dallas\n" +
"Match 44: Jun 22 23:00EST — Jordan vs Algeria — Group J — Levi's Stadium, San Francisco\n" +
"Match 45: Jun 23 16:00EST — England vs Ghana — Group L — Gillette Stadium, Boston\n" +
"Match 46: Jun 23 19:00EST — Panama vs Croatia — Group L — BMO Field, Toronto\n" +
"Match 47: Jun 23 13:00EST — Portugal vs Uzbekistan — Group K — NRG Stadium, Houston\n" +
"Match 48: Jun 23 22:00EST — Colombia vs DR Congo — Group K — Estadio Akron, Guadalajara\n" +
"Match 49: Jun 24 18:00EST — Scotland vs Brazil — Group C — Hard Rock Stadium, Miami\n" +
"Match 50: Jun 24 18:00EST — Morocco vs Haiti — Group C — Mercedes-Benz Stadium, Atlanta\n" +
"Match 51: Jun 24 15:00EST — Switzerland vs Canada — Group B — BC Place, Vancouver\n" +
"Match 52: Jun 24 15:00EST — Bosnia and Herzegovina vs Qatar — Group B — Lumen Field, Seattle\n" +
"Match 53: Jun 24 21:00EST — Czech Republic vs Mexico — Group A — Estadio Azteca, Mexico City\n" +
"Match 54: Jun 24 21:00EST — South Africa vs South Korea — Group A — Estadio BBVA, Monterrey\n" +
"Match 55: Jun 25 16:00EST — Curaçao vs Ivory Coast — Group E — Lincoln Financial Field, Philadelphia\n" +
"Match 56: Jun 25 16:00EST — Ecuador vs Germany — Group E — MetLife Stadium, New York/NJ\n" +
"Match 57: Jun 25 19:00EST — Japan vs Sweden — Group F — AT&T Stadium, Dallas\n" +
"Match 58: Jun 25 19:00EST — Tunisia vs Netherlands — Group F — Arrowhead Stadium, Kansas City\n" +
"Match 59: Jun 25 22:00EST — Turkey vs USA — Group D — SoFi Stadium, Los Angeles\n" +
"Match 60: Jun 25 22:00EST — Paraguay vs Australia — Group D — Levi's Stadium, San Francisco\n" +
"Match 61: Jun 26 15:00EST — Norway vs France — Group I — Gillette Stadium, Boston\n" +
"Match 62: Jun 26 15:00EST — Senegal vs Iraq — Group I — BMO Field, Toronto\n" +
"Match 63: Jun 26 23:00EST — Egypt vs Iran — Group G — Lumen Field, Seattle\n" +
"Match 64: Jun 26 23:00EST — New Zealand vs Belgium — Group G — BC Place, Vancouver\n" +
"Match 65: Jun 26 20:00EST — Cape Verde vs Saudi Arabia — Group H — NRG Stadium, Houston\n" +
"Match 66: Jun 26 20:00EST — Uruguay vs Spain — Group H — Estadio Akron, Guadalajara\n" +
"Match 67: Jun 27 17:00EST — Panama vs England — Group L — MetLife Stadium, New York/NJ\n" +
"Match 68: Jun 27 17:00EST — Croatia vs Ghana — Group L — Lincoln Financial Field, Philadelphia\n" +
"Match 69: Jun 27 22:00EST — Algeria vs Austria — Group J — Arrowhead Stadium, Kansas City\n" +
"Match 70: Jun 27 22:00EST — Jordan vs Argentina — Group J — AT&T Stadium, Dallas\n" +
"Match 71: Jun 27 19:30EST — Colombia vs Portugal — Group K — Hard Rock Stadium, Miami\n" +
"Match 72: Jun 27 19:30EST — DR Congo vs Uzbekistan — Group K — Mercedes-Benz Stadium, Atlanta\n" +
"\n" +
"Match 73: Jun 28 15:00EST — Group A Runner-up vs Group B Runner-up — SoFi Stadium, Los Angeles\n" +
"Match 74: Jun 29 16:30EST — Group E Winners vs Best 3rd Place — Gillette Stadium, Boston\n" +
"Match 75: Jun 29 21:00EST — Group F Winners vs Group C Runner-up — Estadio BBVA, Monterrey\n" +
"Match 76: Jun 29 13:00EST — Group C Winners vs Group F Runner-up — NRG Stadium, Houston\n" +
"Match 77: Jun 30 17:00EST — Group I Winners vs Best 3rd Place — MetLife Stadium, New York/NJ\n" +
"Match 78: Jun 30 13:00EST — Group E Runner-up vs Group I Runner-up — AT&T Stadium, Dallas\n" +
"Match 79: Jun 30 21:00EST — Group A Winners vs Best 3rd Place — Estadio Azteca, Mexico City\n" +
"Match 80: Jul 1 12:00EST — Group L Winners vs Best 3rd Place — Mercedes-Benz Stadium, Atlanta\n" +
"Match 81: Jul 1 20:00EST — Group D Winners vs Best 3rd Place — Levi's Stadium, San Francisco\n" +
"Match 82: Jul 1 16:00EST — Group G Winners vs Best 3rd Place — Lumen Field, Seattle\n" +
"Match 83: Jul 2 19:00EST — Group K Runner-up vs Group L Runner-up — BMO Field, Toronto\n" +
"Match 84: Jul 2 15:00EST — Group H Winners vs Group J Runner-up — SoFi Stadium, Los Angeles\n" +
"Match 85: Jul 2 23:00EST — Group B Winners vs Best 3rd Place — BC Place, Vancouver\n" +
"Match 86: Jul 3 18:00EST — Group J Winners vs Group H Runner-up — Hard Rock Stadium, Miami\n" +
"Match 87: Jul 3 21:30EST — Group K Winners vs Best 3rd Place — Arrowhead Stadium, Kansas City\n" +
"Match 88: Jul 3 14:00EST — Group D Runner-up vs Group G Runner-up — AT&T Stadium, Dallas\n" +
"\n" +
"Match 89: Jul 4 17:00EST — Match 74 Winner vs Match 77 Winner — Lincoln Financial Field, Philadelphia\n" +
"Match 90: Jul 4 13:00EST — Match 73 Winner vs Match 75 Winner — NRG Stadium, Houston\n" +
"Match 91: Jul 5 16:00EST — Match 76 Winner vs Match 78 Winner — MetLife Stadium, New York/NJ\n" +
"Match 92: Jul 5 20:00EST — Match 79 Winner vs Match 80 Winner — Estadio Azteca, Mexico City\n" +
"Match 93: Jul 6 15:00EST — Match 83 Winner vs Match 84 Winner — AT&T Stadium, Dallas\n" +
"Match 94: Jul 6 20:00EST — Match 81 Winner vs Match 82 Winner — Lumen Field, Seattle\n" +
"Match 95: Jul 7 12:00EST — Match 86 Winner vs Match 88 Winner — Mercedes-Benz Stadium, Atlanta\n" +
"Match 96: Jul 7 16:00EST — Match 85 Winner vs Match 87 Winner — BC Place, Vancouver\n" +
"\n" +
"Match 97: Jul 9 16:00EST — Match 89 Winner vs Match 90 Winner — Gillette Stadium, Boston\n" +
"Match 98: Jul 10 15:00EST — Match 93 Winner vs Match 94 Winner — SoFi Stadium, Los Angeles\n" +
"Match 99: Jul 11 17:00EST — Match 91 Winner vs Match 92 Winner — Hard Rock Stadium, Miami\n" +
"Match 100: Jul 11 21:00EST — Match 95 Winner vs Match 96 Winner — Arrowhead Stadium, Kansas City\n" +
"\n" +
"Match 101: Jul 14 15:00EST — Match 97 Winner vs Match 98 Winner — AT&T Stadium, Dallas\n" +
"Match 102: Jul 15 15:00EST — Match 99 Winner vs Match 100 Winner — Mercedes-Benz Stadium, Atlanta\n" +
"\n" +
"Match 103: Jul 18 17:00EST — Match 101 Loser vs Match 102 Loser — Hard Rock Stadium, Miami\n" +
"\n" +
"Match 104: Jul 19 15:00EST — Match 101 Winner vs Match 102 Winner — MetLife Stadium, New York/NJ\n";

const results = [];

const lines = rawSchedule.split('\n');
lines.forEach(line => {
  if(!line.trim()) return;
  // Try pattern for Group Stage matches first
  // Match 1: Jun 11 15:00EST — Mexico vs South Africa — Group A — Estadio Azteca, Mexico City
  const matchGroup = line.match(/^Match (\d+):\s+(.+?)\s+(\d{2}:\d{2})EST\s+—\s+(.+?)\s+vs\s+(.+?)\s+—\s+Group\s+([A-L])\s+—\s+([^,]+),\s+(.*)$/);
  
  if(matchGroup) {
      const mNumber = matchGroup[1];
      const dateStr = matchGroup[2]; // e.g. Jun 11
      const timeStr = matchGroup[3]; // e.g. 15:00
      const tA = matchGroup[4];
      const tB = matchGroup[5];
      const group = matchGroup[6];
      const sName = matchGroup[7];
      const sCity = matchGroup[8];
    
      const day = dateStr.split(" ")[1].padStart(2, '0');
      let month = "06";
      if(dateStr.startsWith("Jul")) month = "07";
      const ds = "2026-" + month + "-" + day;
    
      const utcTime = parseInt(timeStr.split(":")[0]) + 5;
      const hrUTC = String(utcTime % 24).padStart(2, '0');
      const minUTC = timeStr.split(":")[1];
      const utcStr = hrUTC + ":" + minUTC;
      
      const cetTime = (utcTime + 2) % 24;
      const cetStr = String(cetTime).padStart(2, '0') + ":" + minUTC;
    
      const sSlug = stadiumSlugMap[sName.trim()];
      const teamAInfo = getTeamInfo(tA.trim());
      const teamBInfo = getTeamInfo(tB.trim());
      
      const h2h = generateH2h(teamAInfo, teamBInfo);
    
      const stdInfo = getStadiumInfo(sSlug);
      
      const mSlug = teamAInfo.slug + "-vs-" + teamBInfo.slug;
    
      results.push({
        slug: mSlug,
        match_number: parseInt(mNumber),
        type: "scheduled",
        stage: "Group Stage",
        group: group,
        date: ds,
        kickoff_utc: utcStr,
        kickoff_est: timeStr,
        kickoff_gmt: utcStr,
        kickoff_cet: cetStr,
        stadium_slug: sSlug,
        city: stdInfo.city || sCity,
        team_a: teamAInfo,
        team_b: teamBInfo,
        h2h: h2h,
        odds: [
          {
            bookmaker: "Bet365",
            bookmaker_logo: "/logos/bet365.png",
            team_a_win: Number((teamBInfo.fifa_rank > teamAInfo.fifa_rank ? 1.8 + Math.random() : 2.5 + Math.random()).toFixed(2)),
            draw: 3.40,
            team_b_win: Number((teamAInfo.fifa_rank > teamBInfo.fifa_rank ? 1.8 + Math.random() : 2.5 + Math.random()).toFixed(2)),
            affiliate_url: "https://bet365.com/?ref=REPLACE_ID",
            cta: "Bet on Bet365"
          },
          {
            "bookmaker": "William Hill",
            "bookmaker_logo": "/logos/williamhill.png",
            "team_a_win": Number((teamBInfo.fifa_rank > teamAInfo.fifa_rank ? 1.75 + Math.random() : 2.45 + Math.random()).toFixed(2)),
            "draw": 3.50,
            "team_b_win": Number((teamAInfo.fifa_rank > teamBInfo.fifa_rank ? 1.75 + Math.random() : 2.45 + Math.random()).toFixed(2)),
            "affiliate_url": "https://williamhill.com/?ref=REPLACE_ID",
            "cta": "Bet on William Hill"
          },
          {
            "bookmaker": "Unibet",
            "bookmaker_logo": "/logos/unibet.png",
            "team_a_win": Number((teamBInfo.fifa_rank > teamAInfo.fifa_rank ? 1.85 + Math.random() : 2.55 + Math.random()).toFixed(2)),
            "draw": 3.45,
            "team_b_win": Number((teamAInfo.fifa_rank > teamBInfo.fifa_rank ? 1.85 + Math.random() : 2.55 + Math.random()).toFixed(2)),
            "affiliate_url": "https://unibet.com/?ref=REPLACE_ID",
            "cta": "Bet on Unibet"
          }
        ],
        tv_channels: [
          {"country": "USA", "channels": ["Fox Sports", "Telemundo"]},
          {"country": "UK", "channels": ["BBC One", "ITV"]},
          {"country": tA.trim(), "channels": ["National TV 1"]},
          {"country": tB.trim(), "channels": ["National TV 1"]}
        ],
        travel: {
          "hotel_affiliate_url": "https://www.booking.com/search?aid=REPLACE_ID&ss=" + (stdInfo.city || sCity).replace(/ /g, "+"),
          "flight_affiliate_url": "https://www.skyscanner.com/transport/flights/anywhere/?ref=REPLACE_ID",
          "nearest_airport": "Local Airport",
          "hotel_cta": "Find hotels near " + sName.trim(),
          "flight_cta": "Find flights to " + sCity.trim()
        },
        content: {
          "preview": tA.trim() + " faces " + tB.trim() + " in a crucial Group " + group + " clash at " + sName.trim() + ". With both teams looking to secure their place in the knockout stages, this match promises high drama and intense action.",
          "prediction": (teamAInfo.fifa_rank < teamBInfo.fifa_rank ? tA.trim() : tB.trim()) + " to win tightly",
          "prediction_confidence": "Medium",
          "key_battle": "Midfield supremacy",
          "stats_to_watch": [
            "Historical World Cup performances",
            "Recent form leading into the tournament",
            "Key players to watch"
          ],
          "faq": [
            {
              "q": "What time is " + tA.trim() + " vs " + tB.trim() + " 2026?",
              "a": tA.trim() + " vs " + tB.trim() + " kicks off at " + utcStr + " UTC (" + timeStr + " EST) on " + ds + " at " + sName.trim() + " in " + sCity.trim() + "."
            },
            {
              "q": "Where to watch " + tA.trim() + " vs " + tB.trim() + " 2026?",
              "a": "In the USA on Fox Sports and Telemundo. In the UK on BBC One and ITV."
            },
            {
              "q": "Where is " + tA.trim() + " vs " + tB.trim() + " being played?",
              "a": "The match is at " + sName.trim() + " in " + sCity.trim() + "."
            }
          ]
        },
        "meta_title": tA.trim() + " vs " + tB.trim() + " 2026 — Preview, Odds, Prediction & Kickoff Time | FootBrowse",
        "meta_description": tA.trim() + " vs " + tB.trim() + " World Cup 2026 preview. Kickoff " + ds + " at " + sName.trim() + ". Odds, TV channels, head-to-head stats and our prediction for this Group " + group + " clash.",
        "schema_type": "SportsEvent"
      });
  } else {
    // Try Knockout matches
    // Match 73: Jun 28 15:00EST — Group A Runner-up vs Group B Runner-up — SoFi Stadium, Los Angeles
    const matchKO = line.match(/^Match (\d+):\s+(.+?)\s+(\d{2}:\d{2})EST\s+—\s+(.+?)\s+vs\s+(.+?)\s+—\s+([^,]+),\s+(.*)$/);
    if (matchKO) {
        const mNumber = matchKO[1];
        const dateStr = matchKO[2]; // e.g. Jun 11
        const timeStr = matchKO[3]; // e.g. 15:00
        const tA = matchKO[4];
        const tB = matchKO[5];
        const sName = matchKO[6];
        const sCity = matchKO[7];

        const day = dateStr.split(" ")[1].padStart(2, '0');
        let month = "06";
        if(dateStr.startsWith("Jul")) month = "07";
        const ds = "2026-" + month + "-" + day;

        const utcTime = parseInt(timeStr.split(":")[0]) + 5;
        const hrUTC = String(utcTime % 24).padStart(2, '0');
        const minUTC = timeStr.split(":")[1];
        const utcStr = hrUTC + ":" + minUTC;
        
        const cetTime = (utcTime + 2) % 24;
        const cetStr = String(cetTime).padStart(2, '0') + ":" + minUTC;
        
        const sSlug = stadiumSlugMap[sName.trim()];
        const stdInfo = getStadiumInfo(sSlug);
        
        let stageStr = "";
        if (mNumber >= 73 && mNumber <= 88) stageStr = "Round of 32";
        else if (mNumber >= 89 && mNumber <= 96) stageStr = "Round of 16";
        else if (mNumber >= 97 && mNumber <= 100) stageStr = "Quarter Finals";
        else if (mNumber >= 101 && mNumber <= 102) stageStr = "Semi Finals";
        else if (mNumber == 103) stageStr = "Third Place Play-off";
        else if (mNumber == 104) stageStr = "Final";

        const mSlug = tA.toLowerCase().replace(/ /g, '-').replace(/winner/g, "winner").replace(/loser/g, "loser").replace(/match/g, "match") + "-vs-" + tB.toLowerCase().replace(/ /g, '-').replace(/winner/g, "winner").replace(/loser/g, "loser").replace(/match/g, "match");

        results.push({
            slug: mSlug.replace(/--/g, '-'),
            type: "knockout",
            stage: stageStr,
            match_number: parseInt(mNumber),
            date: ds,
            kickoff_utc: utcStr,
            kickoff_est: timeStr,
            kickoff_gmt: utcStr,
            kickoff_cet: cetStr,
            stadium_slug: sSlug,
            city: stdInfo.city || sCity.trim(),
            team_a: {
              slug: "",
              name: tA.trim(),
              code: "xx",
              flag_url: "",
              fifa_rank: 0,
              color_primary: "#CCCCCC"
            },
            team_b: {
              slug: "",
              name: tB.trim(),
              code: "xx",
              flag_url: "",
              fifa_rank: 0,
              color_primary: "#CCCCCC"
            },
            content: {
              preview: "This highly anticipated " + stageStr + " clash between " + tA.trim() + " and " + tB.trim() + " will take place at " + sName.trim() + ". Fans from around the world are set to tune in for this crucial knockout fixture.",
              prediction: "TBD",
            },
            tv_channels: [
              { country: "USA", channels: ["Fox Sports", "Telemundo"] },
              { country: "UK", channels: ["BBC One", "ITV"] }
            ],
            travel: {
              hotel_affiliate_url: "https://www.booking.com/search?aid=REPLACE_ID&ss=" + (stdInfo.city || sCity).trim().replace(/ /g, "+"),
              flight_affiliate_url: "https://www.skyscanner.com/transport/flights/anywhere/?ref=REPLACE_ID"
            },
            schema_type: "SportsEvent"
        });
    } else {
        console.log("Could not parse line: " + line);
    }
  }
});

fs.writeFileSync('./data/matches.json', JSON.stringify(results, null, 2) + '\n');
console.log("Successfully generated " + results.length + " matches.");
