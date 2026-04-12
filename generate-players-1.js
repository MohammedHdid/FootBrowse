const fs = require('fs');

const teamsData = JSON.parse(fs.readFileSync('./data/teams.json', 'utf8'));

// Helper to remove accents for the slug
function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const players = [];

// p=Player
// nm=name, pos=position, num=jersey_number, cb=club, lg=league, ag=age, cp=caps, ig=international_goals,
// wg=wc_goals, wa=wc_appearances, mv=market_value, s1,s2,s3=strengths, 
// o1,o2=overview sentences, tn=team name
function p(tn, nm, pos, num, cb, lg, ag, cp, ig, wg, wa, mv, s1, s2, s3, o1, o2) {
  const team = teamsData.find(t => t.name === tn || (tn === "USA" && t.name === "United States") || (tn === "DR Congo" && t.name === "Congo DR"));
  if (!team) {
    console.error("Team not found: ", tn);
    return;
  }
  
  const slug = slugify(nm);
  // generate shirt link
  const urlName = nm.replace(/ /g, "+");
  const urlCountry = team.name.replace(/ /g, "+");
  const shirt_affiliate_url = `https://www.amazon.com/s?k=${urlName}+${urlCountry}+jersey+2026&tag=REPLACE_ID`;
  
  const meta_title = `${nm} World Cup 2026 — Stats, Goals & Profile | FootBrowse`;
  const meta_description = `${nm} World Cup 2026 profile. ${team.name} ${pos.toLowerCase()} with ${ig} international goals. Stats, career history and World Cup record on FootBrowse.`;
  
  players.push({
    slug,
    name: nm,
    country: team.name,
    country_code: team.code.toLowerCase(),
    flag_url: `https://flagcdn.com/w80/${team.code.toLowerCase()}.png`,
    position: pos,
    jersey_number: num,
    club: cb,
    league: lg,
    age: ag,
    caps: cp,
    international_goals: ig,
    wc_goals: wg,
    wc_appearances: wa,
    photo_url: "",
    avatar_color: team.color_primary || "#1a1a1a",
    market_value_eur: mv,
    strengths: [s1, s2, s3],
    overview: `${o1} ${o2}`.trim(),
    team_slug: team.slug,
    matches: [],
    shirt_affiliate_url,
    meta_title,
    meta_description
  });
}

// ============================================
// Add teams and players below this line
// ============================================

// Group A
p("Mexico", "Edson Álvarez", "Midfielder", 4, "West Ham United", "Premier League", 28, 85, 5, 0, 2, 35000000, "Tackling", "Ball interceptions", "Leadership", "Edson Álvarez is the tenacious midfield anchor for Mexico.", "His crucial experience at West Ham makes him undeniable in big tournaments.");
p("Mexico", "Santiago Giménez", "Forward", 11, "Feyenoord", "Eredivisie", 25, 35, 12, 0, 1, 40000000, "Finishing", "Aerial duels", "Positioning", "Santiago Giménez is the leading striker for the Mexican national team.", "With his lethal finishing at Feyenoord, he hopes to guide Mexico deep into the 2026 tournament.");
p("Mexico", "Hirving Lozano", "Forward", 22, "PSV Eindhoven", "Eredivisie", 30, 75, 18, 1, 2, 22000000, "Pace", "Dribbling", "Long shots", "Hirving 'Chucky' Lozano brings flair and extreme pace to the wing.", "His experience from multiple World Cups makes him Mexico's primary creative outlet.");

p("South Africa", "Percy Tau", "Forward", 10, "Al Ahly", "Egyptian Premier League", 32, 45, 15, 0, 0, 2500000, "Dribbling", "Agility", "Playmaking", "Percy Tau is the primary attacking talisman for South Africa.", "His vast continental experience provides essential leadership for the squad.");
p("South Africa", "Ronwen Williams", "Goalkeeper", 1, "Mamelodi Sundowns", "DStv Premiership", 34, 42, 0, 0, 0, 1500000, "Shot stopping", "Leadership", "Reflexes", "Ronwen Williams is the experienced captain and goalkeeper for South Africa.", "His epic penalty shootout records make him a massive asset in crunch moments.");
p("South Africa", "Lyle Foster", "Forward", 9, "Burnley", "Championship", 25, 20, 5, 0, 0, 13000000, "Strength", "Hold-up play", "Finishing", "Lyle Foster represents the next generation of South African attackers.", "A reliable physical presence in the box, he aims to prove himself on the global stage.");

p("South Korea", "Son Heung-min", "Forward", 7, "Tottenham Hotspur", "Premier League", 33, 125, 45, 3, 3, 40000000, "Explosive pace", "Finishing", "Two-footedness", "Son Heung-min is arguably the greatest Asian player in history.", "The Tottenham legend captains his nation with the hope of a legendary 2026 run.");
p("South Korea", "Kim Min-jae", "Defender", 4, "Bayern Munich", "Bundesliga", 29, 65, 4, 0, 1, 55000000, "Physical strength", "Tackling", "Passing", "Kim Min-jae is a formidable center-back affectionately known as 'The Monster'.", "His experience at Bayern Munich elevates the entire defensive line of South Korea.");
p("South Korea", "Lee Kang-in", "Midfielder", 18, "Paris Saint-Germain", "Ligue 1", 25, 35, 8, 0, 1, 35000000, "Dribbling", "Vision", "Set-pieces", "Lee Kang-in provides creative spark and technical brilliance.", "As a playmaker at PSG, he brings world-class flair to the national team.");

p("Czech Republic", "Patrik Schick", "Forward", 10, "Bayer Leverkusen", "Bundesliga", 30, 45, 22, 0, 0, 25000000, "Finishing", "Aerial duels", "Long shots", "Patrik Schick is the main attacking focal point for the Czech Republic.", "Famous for spectacular goals, he leads the line with immense confidence.");
p("Czech Republic", "Tomáš Souček", "Midfielder", 22, "West Ham United", "Premier League", 31, 75, 13, 0, 0, 30000000, "Aerial threat", "Stamina", "Tackling", "Tomáš Souček is the tireless engine of the Czech midfield.", "His late runs into the box make him nearly as dangerous as a traditional striker.");
p("Czech Republic", "Vladimír Coufal", "Defender", 5, "West Ham United", "Premier League", 33, 48, 1, 0, 0, 8000000, "Work rate", "Crossing", "Aggression", "Vladimír Coufal is an aggressive full-back who commands the right flank.", "He provides endless running and crucial delivery for the Czech attackers.");

// Group B
p("Canada", "Alphonso Davies", "Defender", 19, "Bayern Munich", "Bundesliga", 25, 55, 15, 1, 1, 60000000, "Explosive pace", "Dribbling", "Crossing", "Alphonso Davies is the undisputed star of Canadian football.", "His incredible speed and global profile make him their most dangerous player.");
p("Canada", "Jonathan David", "Forward", 20, "Lille", "Ligue 1", 26, 52, 28, 0, 1, 50000000, "Finishing", "Pace", "Positioning", "Jonathan David is a prolific goalscorer responsible for Canada's attacking output.", "His consistent form in Europe ensures defenders must constantly track his movement.");
p("Canada", "Stephen Eustáquio", "Midfielder", 7, "Porto", "Primeira Liga", 29, 41, 4, 0, 1, 15000000, "Passing", "Vision", "Tackling", "Stephen Eustáquio is the tactical heartbeat of the Canadian midfield.", "He dictates the tempo of the game and breaks down opposing attacks brilliantly.");

p("Bosnia and Herzegovina", "Edin Džeko", "Forward", 11, "Fenerbahçe", "Süper Lig", 40, 140, 65, 1, 1, 1000000, "Aerial ability", "Target man play", "Finishing", "Edin Džeko is the legendary captain and all-time top scorer for his country.", "Even in his final tournament, his target-man ability remains extremely lethal.");
p("Bosnia and Herzegovina", "Ermedin Demirović", "Forward", 9, "VfB Stuttgart", "Bundesliga", 28, 30, 5, 0, 0, 28000000, "Work rate", "Finishing", "Pressing", "Ermedin Demirović is an energetic and modern striker for the national team.", "His fantastic form in the Bundesliga makes him a worthy successor in the attack.");
p("Bosnia and Herzegovina", "Amar Dedić", "Defender", 21, "Red Bull Salzburg", "Austrian Bundesliga", 23, 20, 1, 0, 0, 20000000, "Pace", "Crossing", "Stamina", "Amar Dedić is one of the brightest young prospects in Bosnian football.", "An explosive full-back who aggressively impacts both defense and offense.");

p("Qatar", "Akram Afif", "Forward", 11, "Al Sadd", "Qatar Stars League", 29, 110, 35, 0, 1, 6000000, "Playmaking", "Dribbling", "Finishing", "Akram Afif is widely recognized as Qatar's most talented and dynamic player.", "His creative brilliance has been instrumental in Qatar's regional dominance.");
p("Qatar", "Almoez Ali", "Forward", 19, "Al-Duhail", "Qatar Stars League", 29, 105, 52, 0, 1, 3000000, "Finishing", "Pace", "Positioning", "Almoez Ali is Qatar's record-breaking goalscorer and lethal forward.", "His movement in the box makes him a constant threat during major tournaments.");
p("Qatar", "Meshaal Barsham", "Goalkeeper", 22, "Al Sadd", "Qatar Stars League", 28, 40, 0, 0, 1, 800000, "Shot stopping", "Reflexes", "Penalty saves", "Meshaal Barsham is the reliable final line of defense for the Qatar national team.", "He rose to prominence with multiple crucial tournament penalty saves.");

p("Switzerland", "Granit Xhaka", "Midfielder", 10, "Bayer Leverkusen", "Bundesliga", 33, 135, 15, 2, 3, 20000000, "Passing range", "Leadership", "Long shots", "Granit Xhaka is the driving force and experienced captain of the Swiss team.", "His incredible passing range and leadership dictate the flow of the game.");
p("Switzerland", "Manuel Akanji", "Defender", 5, "Manchester City", "Premier League", 30, 65, 3, 0, 2, 45000000, "Tackling", "Passing", "Speed", "Manuel Akanji is a fundamental pillar of the Swiss defense.", "His tactical intelligence honed under Pep Guardiola makes him a world-class center-back.");
p("Switzerland", "Breel Embolo", "Forward", 7, "Monaco", "Ligue 1", 29, 70, 15, 2, 2, 18000000, "Strength", "Pace", "Hold-up play", "Breel Embolo uses his overwhelming physical strength to disrupt opposing defenses.", "A reliable focal point, he brings both goals and incredible hold-up play.");

// Group C
p("Brazil", "Vinícius Júnior", "Forward", 7, "Real Madrid", "La Liga", 25, 45, 10, 1, 1, 150000000, "Dribbling", "Explosive pace", "Playmaking", "Vinícius Júnior is one of the most electric wide players in world football.", "He is entrusted with carrying the creative and attacking burden for Brazil.");
p("Brazil", "Rodrygo", "Forward", 10, "Real Madrid", "La Liga", 25, 35, 8, 0, 1, 110000000, "Finishing", "Positioning", "Agility", "Rodrygo is a remarkably versatile and deadly attacker for both club and country.", "He excels in tight spaces and consistently scores crucial tournament goals.");
p("Brazil", "Alisson Becker", "Goalkeeper", 1, "Liverpool", "Premier League", 33, 75, 0, 0, 2, 28000000, "Positioning", "Shot stopping", "Distribution", "Alisson Becker brings an astonishing aura of calmness to the Brazilian defense.", "His distribution and 1v1 shot-stopping abilities make him irreplaceable.");

p("Morocco", "Achraf Hakimi", "Defender", 2, "Paris Saint-Germain", "Ligue 1", 27, 85, 10, 0, 2, 60000000, "Pace", "Crossing", "Stamina", "Achraf Hakimi is widely recognized as one of the best right-backs globally.", "His surging runs down the right flank are crucial to Morocco's attacking setups.");
p("Morocco", "Hakim Ziyech", "Midfielder", 7, "Galatasaray", "Süper Lig", 33, 65, 25, 2, 2, 12000000, "Passing", "Long shots", "Set-pieces", "Hakim Ziyech provides pure wizardry with his left foot for the Atlas Lions.", "He serves as the primary playmaker and set-piece specialist for the squad.");
p("Morocco", "Brahim Díaz", "Midfielder", 10, "Real Madrid", "La Liga", 26, 12, 4, 0, 0, 40000000, "Dribbling", "Agility", "Playmaking", "Brahim Díaz represents a huge coup for Moroccan football after joining the squad.", "The Real Madrid creator brings exquisite balance and technical dribbling skills.");

p("Haiti", "Frantzdy Pierrot", "Forward", 20, "Maccabi Haifa", "Israeli Premier League", 31, 35, 22, 0, 0, 3000000, "Aerial threat", "Strength", "Finishing", "Frantzdy Pierrot is the massive target-man leading the line for Haiti.", "His unparalleled physical presence causes chaos in opposing penalty areas.");
p("Haiti", "Duckens Nazon", "Forward", 9, "CSKA Sofia", "First Professional Football League", 32, 55, 30, 0, 0, 1500000, "Pace", "Dribbling", "Finishing", "Duckens Nazon is affectionately known as 'The Duke' by Haitian fans.", "He is the all-time leading scorer bringing essential firepower to their offense.");
p("Haiti", "Ricardo Adé", "Defender", 4, "LDU Quito", "Liga Pro", 35, 40, 2, 0, 0, 1000000, "Tackling", "Leadership", "Positioning", "Ricardo Adé is the veteran captain and bedrock of the Haitian defense.", "His experience and organizational skills are crucial in high-pressure matches.");

p("Scotland", "Andrew Robertson", "Defender", 3, "Liverpool", "Premier League", 32, 80, 4, 0, 0, 30000000, "Crossing", "Work rate", "Leadership", "Andrew Robertson is the fiery captain and heartbeat of the Scottish national team.", "His world-class delivery and endless running define Scotland's left flank.");
p("Scotland", "Scott McTominay", "Midfielder", 4, "Napoli", "Serie A", 29, 58, 12, 0, 0, 32000000, "Strength", "Long shots", "Late runs", "Scott McTominay is a physically dominant presence in the heart of the midfield.", "He has evolved into a serious goal-scoring threat with his late box arrivals.");
p("Scotland", "John McGinn", "Midfielder", 7, "Aston Villa", "Premier League", 31, 70, 20, 0, 0, 35000000, "Work rate", "Dribbling", "Strength", "John McGinn is a fan favorite known for his legendary tracking back and tenacity.", "He offers incredible ball retention and a crucial attacking spark.");

// Group D
p("United States", "Christian Pulisic", "Forward", 10, "AC Milan", "Serie A", 27, 75, 32, 1, 1, 45000000, "Dribbling", "Pace", "Playmaking", "Christian Pulisic is the golden boy of American soccer and the team's talisman.", "He carries the creative burden and consistently delivers in clutch moments.");
p("United States", "Weston McKennie", "Midfielder", 8, "Juventus", "Serie A", 27, 60, 12, 0, 1, 28000000, "Work rate", "Aerial ability", "Tackling", "Weston McKennie is a box-to-box powerhouse capable of dominating the midfield.", "His aggressive pressing and aerial threat make him an undisputed starter.");
p("United States", "Folarin Balogun", "Forward", 9, "Monaco", "Ligue 1", 24, 25, 10, 0, 0, 35000000, "Pace", "Finishing", "Movement", "Folarin Balogun is the elite striker the USMNT desperately sought for years.", "His clinical finishing ability brings a massive edge to the US attack.");

p("Paraguay", "Miguel Almirón", "Midfielder", 10, "Newcastle United", "Premier League", 32, 60, 8, 0, 0, 25000000, "Pace", "Work rate", "Dribbling", "Miguel Almirón injects non-stop energy and incredible pace into Paraguay's lineup.", "His trademark direct running and left-footed strikes make him a massive threat.");
p("Paraguay", "Julio Enciso", "Forward", 19, "Brighton & Hove Albion", "Premier League", 22, 18, 4, 0, 0, 45000000, "Dribbling", "Long shots", "Agility", "Julio Enciso is considered the crown jewel of Paraguayan football's new era.", "His spectacular long-range goals and fearless dribbling bring real x-factor.");
p("Paraguay", "Ramón Sosa", "Forward", 23, "Nottingham Forest", "Premier League", 26, 20, 5, 0, 0, 18000000, "Pace", "Dribbling", "Crossing", "Ramón Sosa uses his blazing speed to terrifying effect on the wing.", "He bypasses full-backs with elite acceleration to set up attacking moves.");

p("Australia", "Mathew Ryan", "Goalkeeper", 1, "AZ Alkmaar", "Eredivisie", 34, 98, 0, 0, 3, 4000000, "Reflexes", "Shot stopping", "Leadership", "Mathew Ryan is the seasoned captain and bedrock of the Socceroos.", "He brings huge tournament experience having backstopped Australia for a decade.");
p("Australia", "Harry Souttar", "Defender", 19, "Leicester City", "Championship", 27, 35, 12, 0, 1, 15000000, "Aerial threat", "Strength", "Tackling", "Harry Souttar is a towering physical presence for Australia at both ends.", "He is remarkably prolific for a defender due to his set-piece dominance.");
p("Australia", "Craig Goodwin", "Forward", 23, "Al-Wehda", "Saudi Pro League", 34, 30, 8, 1, 1, 1500000, "Crossing", "Set-pieces", "Finishing", "Craig Goodwin is a clinical wide man delivering dangerous left-footed crosses.", "His fantastic performances in Qatar established his status as a national hero.");

p("Turkey", "Hakan Çalhanoğlu", "Midfielder", 10, "Inter Milan", "Serie A", 32, 95, 20, 0, 0, 35000000, "Passing", "Set-pieces", "Vision", "Hakan Çalhanoğlu is the deep-lying playmaker pulling the strings for Turkey.", "His world-class set-piece delivery and long shots constantly terrify goalkeepers.");
p("Turkey", "Arda Güler", "Midfielder", 8, "Real Madrid", "La Liga", 21, 18, 5, 0, 0, 60000000, "Dribbling", "Playmaking", "Agility", "Arda Güler is globally hyped as the generational talent of Turkish football.", "The Real Madrid prodigy possesses magical playmaking abilities and incredible poise.");
p("Turkey", "Kenan Yıldız", "Forward", 19, "Juventus", "Serie A", 21, 15, 6, 0, 0, 45000000, "Dribbling", "Pace", "Finishing", "Kenan Yıldız represents the future of Turkey's explosive forward line.", "His raw ability and fearless attacking mindset makes him extremely exciting.");

// Output chunks 
fs.writeFileSync('./generate-players-2.js', 'console.log("Chunk 1 loaded");\n');
