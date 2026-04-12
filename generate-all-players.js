const fs = require('fs');

const teamsData = JSON.parse(fs.readFileSync('./data/teams.json', 'utf8'));

function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const playersRaw = [
// Group A
"Mexico|Edson Álvarez|Midfielder|4|West Ham United|Premier League|28|85|5|0|2|35000000|Tackling|Interception|Leadership",
"Mexico|Santiago Giménez|Forward|11|Feyenoord|Eredivisie|25|35|12|0|1|40000000|Finishing|Aerial duels|Positioning",
"Mexico|Hirving Lozano|Forward|22|PSV Eindhoven|Eredivisie|30|75|18|1|2|22000000|Pace|Dribbling|Long shots",
"South Africa|Percy Tau|Forward|10|Al Ahly|Egyptian Premier League|32|45|15|0|0|2500000|Dribbling|Agility|Playmaking",
"South Africa|Ronwen Williams|Goalkeeper|1|Mamelodi Sundowns|DStv Premiership|34|42|0|0|0|1500000|Shot stopping|Leadership|Reflexes",
"South Africa|Lyle Foster|Forward|9|Burnley|Championship|25|20|5|0|0|13000000|Strength|Hold-up play|Finishing",
"South Korea|Son Heung-min|Forward|7|Tottenham Hotspur|Premier League|33|125|45|3|3|40000000|Pace|Finishing|Two-footedness",
"South Korea|Kim Min-jae|Defender|4|Bayern Munich|Bundesliga|29|65|4|0|1|55000000|Strength|Tackling|Passing",
"South Korea|Lee Kang-in|Midfielder|18|Paris Saint-Germain|Ligue 1|25|35|8|0|1|35000000|Dribbling|Vision|Set-pieces",
"Czech Republic|Patrik Schick|Forward|10|Bayer Leverkusen|Bundesliga|30|45|22|0|0|25000000|Finishing|Aerial duels|Long shots",
"Czech Republic|Tomáš Souček|Midfielder|22|West Ham United|Premier League|31|75|13|0|0|30000000|Aerial threat|Stamina|Tackling",
"Czech Republic|Vladimír Coufal|Defender|5|West Ham United|Premier League|33|48|1|0|0|8000000|Work rate|Crossing|Aggression",

// Group B
"Canada|Alphonso Davies|Defender|19|Bayern Munich|Bundesliga|25|55|15|1|1|60000000|Pace|Dribbling|Crossing",
"Canada|Jonathan David|Forward|20|Lille|Ligue 1|26|52|28|0|1|50000000|Finishing|Pace|Positioning",
"Canada|Stephen Eustáquio|Midfielder|7|Porto|Primeira Liga|29|41|4|0|1|15000000|Passing|Vision|Tackling",
"Bosnia and Herzegovina|Edin Džeko|Forward|11|Fenerbahçe|Süper Lig|40|140|65|1|1|1000000|Aerial ability|Target man|Finishing",
"Bosnia and Herzegovina|Ermedin Demirović|Forward|9|VfB Stuttgart|Bundesliga|28|30|5|0|0|28000000|Work rate|Finishing|Pressing",
"Bosnia and Herzegovina|Amar Dedić|Defender|21|Red Bull Salzburg|Austrian Bundesliga|23|20|1|0|0|20000000|Pace|Crossing|Stamina",
"Qatar|Akram Afif|Forward|11|Al Sadd|Qatar Stars League|29|110|35|0|1|6000000|Playmaking|Dribbling|Finishing",
"Qatar|Almoez Ali|Forward|19|Al-Duhail|Qatar Stars League|29|105|52|0|1|3000000|Finishing|Pace|Positioning",
"Qatar|Meshaal Barsham|Goalkeeper|22|Al Sadd|Qatar Stars League|28|40|0|0|1|800000|Shot stopping|Reflexes|Penalty saves",
"Switzerland|Granit Xhaka|Midfielder|10|Bayer Leverkusen|Bundesliga|33|135|15|2|3|20000000|Passing|Leadership|Long shots",
"Switzerland|Manuel Akanji|Defender|5|Manchester City|Premier League|30|65|3|0|2|45000000|Tackling|Passing|Speed",
"Switzerland|Breel Embolo|Forward|7|Monaco|Ligue 1|29|70|15|2|2|18000000|Strength|Pace|Hold-up play",

// Group C
"Brazil|Vinícius Júnior|Forward|7|Real Madrid|La Liga|25|45|10|1|1|150000000|Dribbling|Pace|Playmaking",
"Brazil|Rodrygo|Forward|10|Real Madrid|La Liga|25|35|8|0|1|110000000|Finishing|Positioning|Agility",
"Brazil|Alisson Becker|Goalkeeper|1|Liverpool|Premier League|33|75|0|0|2|28000000|Positioning|Shot stopping|Distribution",
"Morocco|Achraf Hakimi|Defender|2|Paris Saint-Germain|Ligue 1|27|85|10|0|2|60000000|Pace|Crossing|Stamina",
"Morocco|Hakim Ziyech|Midfielder|7|Galatasaray|Süper Lig|33|65|25|2|2|12000000|Passing|Long shots|Set-pieces",
"Morocco|Brahim Díaz|Midfielder|10|Real Madrid|La Liga|26|12|4|0|0|40000000|Dribbling|Agility|Playmaking",
"Haiti|Frantzdy Pierrot|Forward|20|Maccabi Haifa|Israeli Premier|31|35|22|0|0|3000000|Aerial threat|Strength|Finishing",
"Haiti|Duckens Nazon|Forward|9|CSKA Sofia|Bulgarian First|32|55|30|0|0|1500000|Pace|Dribbling|Finishing",
"Haiti|Ricardo Adé|Defender|4|LDU Quito|Liga Pro|35|40|2|0|0|1000000|Tackling|Leadership|Positioning",
"Scotland|Andrew Robertson|Defender|3|Liverpool|Premier League|32|80|4|0|0|30000000|Crossing|Work rate|Leadership",
"Scotland|Scott McTominay|Midfielder|4|Napoli|Serie A|29|58|12|0|0|32000000|Strength|Long shots|Late runs",
"Scotland|John McGinn|Midfielder|7|Aston Villa|Premier League|31|70|20|0|0|35000000|Work rate|Dribbling|Strength",

// Group D
"United States|Christian Pulisic|Forward|10|AC Milan|Serie A|27|75|32|1|1|45000000|Dribbling|Pace|Playmaking",
"United States|Weston McKennie|Midfielder|8|Juventus|Serie A|27|60|12|0|1|28000000|Work rate|Aerial ability|Stamina",
"United States|Folarin Balogun|Forward|9|Monaco|Ligue 1|24|25|10|0|0|35000000|Pace|Finishing|Movement",
"Paraguay|Miguel Almirón|Midfielder|10|Newcastle United|Premier League|32|60|8|0|0|25000000|Pace|Work rate|Dribbling",
"Paraguay|Julio Enciso|Forward|19|Brighton & Hove Albion|Premier League|22|18|4|0|0|45000000|Dribbling|Long shots|Agility",
"Paraguay|Ramón Sosa|Forward|23|Nottingham Forest|Premier League|26|20|5|0|0|18000000|Pace|Dribbling|Crossing",
"Australia|Mathew Ryan|Goalkeeper|1|AZ Alkmaar|Eredivisie|34|98|0|0|3|4000000|Reflexes|Shot stopping|Leadership",
"Australia|Harry Souttar|Defender|19|Leicester City|Championship|27|35|12|0|1|15000000|Aerial threat|Strength|Tackling",
"Australia|Craig Goodwin|Forward|23|Al-Wehda|Saudi Pro League|34|30|8|1|1|1500000|Crossing|Set-pieces|Finishing",
"Turkey|Hakan Çalhanoğlu|Midfielder|10|Inter Milan|Serie A|32|95|20|0|0|35000000|Passing|Set-pieces|Vision",
"Turkey|Arda Güler|Midfielder|8|Real Madrid|La Liga|21|18|5|0|0|60000000|Dribbling|Playmaking|Agility",
"Turkey|Kenan Yıldız|Forward|19|Juventus|Serie A|21|15|6|0|0|45000000|Dribbling|Pace|Finishing",

// Group E
"Germany|Jamal Musiala|Midfielder|10|Bayern Munich|Bundesliga|23|45|12|0|1|130000000|Dribbling|Agility|Playmaking",
"Germany|Florian Wirtz|Midfielder|17|Bayer Leverkusen|Bundesliga|23|30|8|0|0|120000000|Vision|Passing|Playmaking",
"Germany|Leroy Sané|Forward|19|Bayern Munich|Bundesliga|30|70|15|0|1|60000000|Pace|Dribbling|Long shots",
"Curaçao|Juninho Bacuna|Midfielder|7|Birmingham City|League One|28|35|8|0|0|4000000|Passing|Work rate|Dribbling",
"Curaçao|Leandro Bacuna|Midfielder|10|Groningen|Eerste Divisie|34|55|15|0|0|1000000|Leadership|Experience|Set-pieces",
"Curaçao|Jurien Gaari|Defender|3|RKC Waalwijk|Eredivisie|32|40|2|0|0|800000|Tackling|Strength|Resilience",
"Ivory Coast|Sébastien Haller|Forward|22|Borussia Dortmund|Bundesliga|31|35|15|0|0|25000000|Aerial threat|Strength|Finishing",
"Ivory Coast|Franck Kessié|Midfielder|8|Al-Ahli|Saudi Pro League|29|80|12|0|0|20000000|Strength|Penalty taking|Tackling",
"Ivory Coast|Seko Fofana|Midfielder|6|Al-Nassr|Saudi Pro League|31|20|6|0|0|18000000|Dribbling|Work rate|Long shots",
"Ecuador|Moisés Caicedo|Midfielder|23|Chelsea|Premier League|24|50|4|1|1|90000000|Tackling|Stamina|Passing",
"Ecuador|Enner Valencia|Forward|13|Internacional|Série A|36|95|45|6|2|2000000|Finishing|Aerial ability|Leadership",
"Ecuador|Piero Hincapié|Defender|3|Bayer Leverkusen|Bundesliga|24|45|2|0|1|50000000|Tackling|Pace|Passing",

// Group F
"Netherlands|Virgil van Dijk|Defender|4|Liverpool|Premier League|34|85|8|1|1|20000000|Aerial threat|Leadership|Tackling",
"Netherlands|Frenkie de Jong|Midfielder|21|Barcelona|La Liga|29|75|4|1|1|60000000|Dribbling|Passing|Vision",
"Netherlands|Xavi Simons|Midfielder|7|Paris Saint-Germain|Ligue 1|23|30|5|0|1|80000000|Agility|Dribbling|Vision",
"Japan|Kaoru Mitoma|Midfielder|9|Brighton & Hove Albion|Premier League|29|35|12|0|1|40000000|Dribbling|Pace|Agility",
"Japan|Takefusa Kubo|Midfielder|20|Real Sociedad|La Liga|25|45|8|0|1|50000000|Dribbling|Vision|Agility",
"Japan|Wataru Endo|Midfielder|6|Liverpool|Premier League|33|70|4|0|1|12000000|Tackling|Leadership|Stamina",
"Sweden|Alexander Isak|Forward|9|Newcastle United|Premier League|26|60|15|0|0|75000000|Pace|Finishing|Dribbling",
"Sweden|Dejan Kulusevski|Midfielder|21|Tottenham|Premier League|26|50|8|0|0|55000000|Work rate|Dribbling|Passing",
"Sweden|Viktor Gyökeres|Forward|17|Sporting CP|Primeira Liga|28|35|18|0|0|65000000|Strength|Finishing|Pace",
"Tunisia|Ellyes Skhiri|Midfielder|17|Eintracht Frankfurt|Bundesliga|31|75|4|0|2|12000000|Stamina|Tackling|Passing",
"Tunisia|Youssef Msakni|Forward|7|Al-Arabi|Qatar Stars League|35|110|25|0|1|1000000|Dribbling|Experience|Finishing",
"Tunisia|Montassar Talbi|Defender|3|Lorient|Ligue 1|28|55|2|0|1|8000000|Aerial threat|Tackling|Leadership",

// Group G
"Belgium|Kevin De Bruyne|Midfielder|7|Manchester City|Premier League|34|115|30|2|3|40000000|Passing|Vision|Long shots",
"Belgium|Jérémy Doku|Forward|22|Manchester City|Premier League|24|45|8|0|1|65000000|Pace|Dribbling|Agility",
"Belgium|Romelu Lukaku|Forward|10|Roma|Serie A|33|130|90|5|3|20000000|Strength|Finishing|Aerial ability",
"Egypt|Mohamed Salah|Forward|10|Liverpool|Premier League|34|110|65|2|1|45000000|Finishing|Pace|Dribbling",
"Egypt|Omar Marmoush|Forward|22|Eintracht Frankfurt|Bundesliga|27|45|12|0|0|30000000|Pace|Finishing|Dribbling",
"Egypt|Trezeguet|Midfielder|7|Trabzonspor|Süper Lig|31|80|20|0|1|8000000|Work rate|Dribbling|Pace",
"Iran|Mehdi Taremi|Forward|9|Inter Milan|Serie A|33|90|50|2|2|12000000|Finishing|Positioning|Aerial threat",
"Iran|Sardar Azmoun|Forward|20|Roma|Serie A|31|85|55|0|2|10000000|Finishing|Aerial ability|Pace",
"Iran|Alireza Jahanbakhsh|Midfielder|7|Feyenoord|Eredivisie|32|90|18|0|3|4000000|Leadership|Crossing|Work rate",
"New Zealand|Chris Wood|Forward|9|Nottingham Forest|Premier League|34|85|40|0|1|5000000|Aerial threat|Strength|Finishing",
"New Zealand|Liberato Cacace|Defender|13|Empoli|Serie A|25|35|1|0|0|8000000|Pace|Crossing|Tackling",
"New Zealand|Marko Stamenić|Midfielder|8|Red Star|Serbian SuperLiga|24|25|2|0|0|6000000|Passing|Work rate|Tackling",

// Group H
"Spain|Rodri|Midfielder|16|Manchester City|Premier League|30|65|5|0|1|100000000|Passing|Tackling|Vision",
"Spain|Lamine Yamal|Forward|19|Barcelona|La Liga|18|25|5|0|0|120000000|Dribbling|Agility|Vision",
"Spain|Pedri|Midfielder|20|Barcelona|La Liga|23|45|3|0|1|80000000|Passing|Vision|Dribbling",
"Cape Verde|Ryan Mendes|Forward|20|Fatih Karagümrük|Süper Lig|36|85|20|0|0|800000|Dribbling|Experience|Finishing",
"Cape Verde|Jovane Cabral|Forward|11|Salernitana|Serie A|28|20|4|0|0|4000000|Pace|Long shots|Dribbling",
"Cape Verde|Bebé|Forward|7|Rayo Vallecano|La Liga|35|25|8|0|0|600000|Long shots|Strength|Free-kicks",
"Saudi Arabia|Salem Al-Dawsari|Midfielder|10|Al Hilal|Saudi Pro League|34|90|25|3|2|2000000|Dribbling|Agility|Playmaking",
"Saudi Arabia|Saud Abdulhamid|Defender|12|Al Hilal|Saudi Pro League|26|45|2|0|1|4000000|Pace|Stamina|Crossing",
"Saudi Arabia|Firas Al-Buraikan|Forward|9|Al Ahli|Saudi Pro League|26|50|12|0|1|5000000|Finishing|Positioning|Work rate",
"Uruguay|Federico Valverde|Midfielder|15|Real Madrid|La Liga|27|75|12|0|1|100000000|Stamina|Long shots|Work rate",
"Uruguay|Darwin Núñez|Forward|9|Liverpool|Premier League|27|45|20|0|1|75000000|Pace|Strength|Finishing",
"Uruguay|Ronald Araújo|Defender|4|Barcelona|La Liga|27|45|2|0|1|70000000|Strength|Speed|Tackling",

// Group I
"France|Kylian Mbappé|Forward|10|Real Madrid|La Liga|27|91|49|12|3|180000000|Pace|Finishing|Dribbling",
"France|Antoine Griezmann|Midfielder|7|Atlético Madrid|La Liga|35|145|52|5|3|10000000|Playmaking|Work rate|Vision",
"France|William Saliba|Defender|2|Arsenal|Premier League|25|40|0|0|1|80000000|Tackling|Strength|Passing",
"Senegal|Sadio Mané|Forward|10|Al-Nassr|Saudi Pro League|34|115|45|2|2|8000000|Pace|Dribbling|Leadership",
"Senegal|Kalidou Koulibaly|Defender|3|Al-Hilal|Saudi Pro League|34|85|2|0|2|6000000|Strength|Tackling|Leadership",
"Senegal|Nicolas Jackson|Forward|7|Chelsea|Premier League|24|25|8|0|0|45000000|Pace|Finishing|Strength",
"Iraq|Aymen Hussein|Forward|18|Al-Quwa Al-Jawiya|Iraq Stars League|30|85|40|0|0|1500000|Aerial threat|Strength|Finishing",
"Iraq|Ali Jasim|Midfielder|17|Como|Serie A|22|30|8|0|0|6000000|Dribbling|Playmaking|Pace",
"Iraq|Zidane Iqbal|Midfielder|14|FC Utrecht|Eredivisie|23|35|3|0|0|8000000|Passing|Vision|Dribbling",
"Norway|Erling Haaland|Forward|9|Manchester City|Premier League|25|55|48|0|0|180000000|Finishing|Strength|Pace",
"Norway|Martin Ødegaard|Midfielder|10|Arsenal|Premier League|27|75|12|0|0|90000000|Playmaking|Vision|Passing",
"Norway|Alexander Sørloth|Forward|19|Atlético Madrid|La Liga|30|65|25|0|0|30000000|Strength|Aerial ability|Finishing",

// Group J
"Argentina|Lionel Messi|Forward|10|Inter Miami|MLS|38|195|115|13|5|20000000|Playmaking|Dribbling|Vision",
"Argentina|Emiliano Martínez|Goalkeeper|23|Aston Villa|Premier League|33|55|0|0|1|28000000|Shot stopping|Mental warfare|Reflexes",
"Argentina|Julián Álvarez|Forward|9|Atlético Madrid|La Liga|26|50|18|4|1|80000000|Work rate|Finishing|Pressing",
"Algeria|Riyad Mahrez|Forward|7|Al-Ahli|Saudi Pro League|35|105|35|1|1|10000000|Dribbling|Passing|First touch",
"Algeria|Ismaël Bennacer|Midfielder|22|AC Milan|Serie A|28|65|3|0|0|30000000|Tackling|Passing|Agility",
"Algeria|Houssem Aouar|Midfielder|8|Al-Ittihad|Saudi Pro League|27|25|3|0|0|15000000|Dribbling|Vision|Playmaking",
"Austria|David Alaba|Defender|8|Real Madrid|La Liga|33|115|18|0|0|18000000|Leadership|Passing|Versatility",
"Austria|Marcel Sabitzer|Midfielder|9|Borussia Dortmund|Bundesliga|32|90|20|0|0|15000000|Long shots|Work rate|Passing",
"Austria|Konrad Laimer|Midfielder|20|Bayern Munich|Bundesliga|29|50|5|0|0|25000000|Work rate|Tackling|Stamina",
"Jordan|Musa Al-Taamari|Forward|10|Montpellier|Ligue 1|28|80|25|0|0|8000000|Dribbling|Pace|Finishing",
"Jordan|Yazan Al-Naimat|Forward|11|Al Ahli|Qatar Stars League|26|50|18|0|0|2000000|Pace|Finishing|Agility",
"Jordan|Yazeed Abulaila|Goalkeeper|1|Al-Jabalain|Saudi First Div|33|50|0|0|0|500000|Reflexes|Shot stopping|Leadership",

// Group K
"Portugal|Cristiano Ronaldo|Forward|7|Al-Nassr|Saudi Pro League|41|230|140|8|5|10000000|Aerial threat|Finishing|Leadership",
"Portugal|Bruno Fernandes|Midfielder|8|Manchester United|Premier League|31|80|25|2|2|60000000|Playmaking|Stamina|Long shots",
"Portugal|Bernardo Silva|Midfielder|10|Manchester City|Premier League|31|100|15|0|2|70000000|Dribbling|Work rate|Vision",
"DR Congo|Chancel Mbemba|Defender|22|Marseille|Ligue 1|31|80|5|0|0|15000000|Tackling|Strength|Leadership",
"DR Congo|Yoane Wissa|Forward|20|Brentford|Premier League|29|35|10|0|0|25000000|Pace|Finishing|Agility",
"DR Congo|Arthur Masuaku|Defender|26|Beşiktaş|Süper Lig|32|35|3|0|0|5000000|Dribbling|Crossing|Pace",
"Uzbekistan|Eldor Shomurodov|Forward|14|Cagliari|Serie A|30|80|45|0|0|8000000|Finishing|Aerial ability|Strength",
"Uzbekistan|Jaloliddin Masharipov|Midfielder|10|Esteghlal|Persian Gulf Pro League|32|65|12|0|0|2000000|Dribbling|Playmaking|Pace",
"Uzbekistan|Otabek Shukurov|Midfielder|9|Kayserispor|Süper Lig|29|60|4|0|0|3000000|Passing|Work rate|Tackling",
"Colombia|Luis Díaz|Forward|7|Liverpool|Premier League|29|65|18|0|1|75000000|Dribbling|Pace|Finishing",
"Colombia|Jhon Arias|Midfielder|21|Fluminense|Série A|28|30|5|0|0|15000000|Dribbling|Vision|Work rate",
"Colombia|James Rodríguez|Midfielder|10|São Paulo|Série A|34|100|27|6|2|5000000|Playmaking|Vision|Long shots",

// Group L
"England|Harry Kane|Forward|9|Bayern Munich|Bundesliga|32|100|65|8|2|90000000|Finishing|Hold-up play|Passing",
"England|Jude Bellingham|Midfielder|10|Real Madrid|La Liga|22|40|10|1|1|150000000|Dribbling|Strength|Work rate",
"England|Bukayo Saka|Forward|7|Arsenal|Premier League|24|45|15|3|1|120000000|Pace|Dribbling|Finishing",
"Croatia|Luka Modrić|Midfielder|10|Real Madrid|La Liga|40|175|25|2|4|5000000|Passing|Vision|Leadership",
"Croatia|Joško Gvardiol|Defender|4|Manchester City|Premier League|24|35|2|1|1|80000000|Tackling|Strength|Pace",
"Croatia|Mateo Kovačić|Midfielder|8|Manchester City|Premier League|32|100|5|0|3|30000000|Dribbling|Passing|Work rate",
"Ghana|Mohammed Kudus|Midfielder|20|West Ham United|Premier League|25|35|12|2|1|50000000|Dribbling|Finishing|Pace",
"Ghana|Thomas Partey|Midfielder|5|Arsenal|Premier League|33|50|15|0|1|15000000|Tackling|Passing|Strength",
"Ghana|Iñaki Williams|Forward|9|Athletic Bilbao|La Liga|31|20|2|0|1|20000000|Pace|Work rate|Finishing",
"Panama|Adalberto Carrasquilla|Midfielder|8|Houston Dynamo|MLS|27|55|2|0|1|5000000|Passing|Dribbling|Vision",
"Panama|Michael Amir Murillo|Defender|23|Marseille|Ligue 1|30|75|8|0|1|6000000|Pace|Crossing|Tackling",
"Panama|José Fajardo|Forward|17|Universidad Católica|Liga Pro|32|45|12|0|0|1000000|Finishing|Pace|Positioning"
];

const players = [];

for (const line of rawData) {
  const parts = line.split('|');
  const tn = parts[0];
  const nm = parts[1];
  const pos = parts[2];
  const num = parseInt(parts[3], 10);
  const cb = parts[4];
  const lg = parts[5];
  const ag = parseInt(parts[6], 10);
  const cp = parseInt(parts[7], 10);
  const ig = parseInt(parts[8], 10);
  const wg = parseInt(parts[9], 10);
  const wa = parseInt(parts[10], 10);
  const mv = parseInt(parts[11], 10);
  const s1 = parts[12];
  const s2 = parts[13];
  const s3 = parts[14];
  
  const team = teamsData.find(t => t.name === tn || (tn === "USA" && t.name === "United States") || (tn === "DR Congo" && t.name === "Congo DR"));
  if (!team) {
    console.error("Team not found: ", tn);
    continue;
  }
  
  const slug = slugify(nm);
  
  const urlName = nm.replace(/ /g, "+");
  const urlCountry = team.name.replace(/ /g, "+");
  const shirt_affiliate_url = `https://www.amazon.com/s?k=${urlName}+${urlCountry}+jersey+2026&tag=REPLACE_ID`;
  
  const meta_title = `${nm} World Cup 2026 — Stats, Goals & Profile | FootBrowse`;
  const meta_description = `${nm} World Cup 2026 profile. ${team.name} ${pos.toLowerCase()} with ${ig} international goals. Stats, career history and World Cup record on FootBrowse.`;
  
  // Algorithmic description strictly enforcing the 2 sentences rule without LLM repetition loops
  const o1 = `${nm} is a highly rated ${pos.toLowerCase()} playing for the ${team.name} national team.`;
  const o2 = `He plays his club football for ${cb} in the ${lg} and aims to make a significant impact at the 2026 World Cup.`;
  
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
    overview: `${o1} ${o2}`,
    team_slug: team.slug,
    matches: [],
    shirt_affiliate_url,
    meta_title,
    meta_description
  });
}

// 48 teams * 3 players = 144. Let's make sure we have exactly 144
console.log("Generated players count:", players.length);

fs.writeFileSync('./data/players.json', JSON.stringify(players, null, 2));

console.log("Done! Wrote to data/players.json");
