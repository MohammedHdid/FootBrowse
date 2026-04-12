const fs = require('fs');

const stadiumsFile = './data/stadiums.json';
const stadiums = JSON.parse(fs.readFileSync(stadiumsFile, 'utf8'));

const newStadiums = [
  {
    "slug": "estadio-akron",
    "name": "Estadio Akron",
    "city": "Guadalajara",
    "state": "Jalisco",
    "country": "Mexico",
    "capacity": 48071,
    "surface": "Grass",
    "roof": "Open",
    "opened": 2010,
    "wc_matches": 4,
    "is_final_venue": false,
    "is_opening_venue": false,
    "photo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Estadio_Omnilife_2011.jpg/1280px-Estadio_Omnilife_2011.jpg",
    "photo_credit": "Wikipedia Commons",
    "lat": 20.6816,
    "lng": -103.4627,
    "nearest_airport": "Guadalajara International (GDL)",
    "airport_distance_km": 30,
    "nearest_city": "Guadalajara",
    "transport": "Mi Macro Periférico BRT; ride-share available; special matchday shuttles from city center",
    "parking_available": true,
    "hotel_affiliate_url": "https://www.booking.com/search?aid=REPLACE_AID&ss=Guadalajara+Mexico",
    "flight_affiliate_url": "https://www.skyscanner.com/transport/flights/anywhere/gdl/?ref=REPLACE_AID",
    "matches": [],
    "overview": "Estadio Akron, famous for its volcano-like grass exterior, is one of Mexico's most striking modern stadiums. Located in the Zapopan municipality of Guadalajara, it has hosted the Pan American Games and is the home of Chivas.",
    "meta_title": "Estadio Akron World Cup 2026 — Matches, Hotels & Guide | FootBrowse",
    "meta_description": "Complete guide to Estadio Akron in Guadalajara for World Cup 2026. Matches hosted, transport, hotels, and seating guide."
  },
  {
    "slug": "mercedes-benz-stadium",
    "name": "Mercedes-Benz Stadium",
    "city": "Atlanta",
    "state": "Georgia",
    "country": "USA",
    "capacity": 71000,
    "surface": "Grass",
    "roof": "Retractable",
    "opened": 2017,
    "wc_matches": 8,
    "is_final_venue": false,
    "is_opening_venue": false,
    "photo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mercedes-Benz_Stadium_August_2017.jpg/1280px-Mercedes-Benz_Stadium_August_2017.jpg",
    "photo_credit": "Wikipedia Commons",
    "lat": 33.7554,
    "lng": -84.4008,
    "nearest_airport": "Hartsfield-Jackson Atlanta (ATL)",
    "airport_distance_km": 16,
    "nearest_city": "Atlanta",
    "transport": "MARTA to GWCC/CNN Center Station or Vine City Station; easily walkable from downtown hotels",
    "parking_available": true,
    "hotel_affiliate_url": "https://www.booking.com/search?aid=REPLACE_AID&ss=Atlanta+Georgia",
    "flight_affiliate_url": "https://www.skyscanner.com/transport/flights/anywhere/atl/?ref=REPLACE_AID",
    "matches": [],
    "overview": "Mercedes-Benz Stadium in Atlanta is a marvel of modern architecture, featuring a unique eight-panel retractable roof. Home to Atlanta United and the Falcons, it boasts state-of-the-art amenities and a massive halo board.",
    "meta_title": "Mercedes-Benz Stadium World Cup 2026 — Matches, Hotels & Guide | FootBrowse",
    "meta_description": "Complete guide to Mercedes-Benz Stadium for World Cup 2026. Matches hosted, transport from ATL, hotels in Atlanta, and seating guide."
  },
  {
    "slug": "lumen-field",
    "name": "Lumen Field",
    "city": "Seattle",
    "state": "Washington",
    "country": "USA",
    "capacity": 69000,
    "surface": "Grass",
    "roof": "Partial Canopy",
    "opened": 2002,
    "wc_matches": 6,
    "is_final_venue": false,
    "is_opening_venue": false,
    "photo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Lumen_Field_West_Stand.jpg/1280px-Lumen_Field_West_Stand.jpg",
    "photo_credit": "Wikipedia Commons",
    "lat": 47.5952,
    "lng": -122.3316,
    "nearest_airport": "Seattle-Tacoma International (SEA)",
    "airport_distance_km": 20,
    "nearest_city": "Seattle",
    "transport": "Link Light Rail to Stadium Station; Sounder commuter rail; multiple Metro bus routes; short walk from Pioneer Square",
    "parking_available": false,
    "hotel_affiliate_url": "https://www.booking.com/search?aid=REPLACE_AID&ss=Seattle+Washington",
    "flight_affiliate_url": "https://www.skyscanner.com/transport/flights/anywhere/sea/?ref=REPLACE_AID",
    "matches": [],
    "overview": "Lumen Field provides one of the best home-field advantages in American sports due to its acoustic design, which amplifies crowd noise. Located in downtown Seattle with views of the skyline and Puget Sound.",
    "meta_title": "Lumen Field World Cup 2026 — Matches, Hotels & Guide | FootBrowse",
    "meta_description": "Complete guide to Lumen Field for World Cup 2026. Matches hosted, transport from SEA, hotels in downtown Seattle, and seating guide."
  }
];

newStadiums.forEach(ns => {
  if (!stadiums.find(s => s.slug === ns.slug)) {
    stadiums.push(ns);
  }
});
fs.writeFileSync(stadiumsFile, JSON.stringify(stadiums, null, 2) + '\n');
console.log('Stadiums updated successfully');
