const fs = require('fs');

const stadiumsFile = './data/stadiums.json';
const stadiums = JSON.parse(fs.readFileSync(stadiumsFile, 'utf8'));

const targets = {
  "estadio-akron": "Estadio_Akron",
  "mercedes-benz-stadium": "Mercedes-Benz_Stadium",
  "lumen-field": "Lumen_Field"
};

async function fixStadiums() {
  for (const stadium of stadiums) {
    if (targets[stadium.slug]) {
      const pageName = targets[stadium.slug];
      const res = await fetch('https://en.wikipedia.org/w/api.php?action=query&titles=' + pageName + '&prop=pageimages&format=json&pithumbsize=1280');
      const data = await res.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pages[pageId].thumbnail?.source) {
        stadium.photo_url = pages[pageId].thumbnail.source;
        console.log("Updated", stadium.slug, stadium.photo_url);
      }
    }
  }
  fs.writeFileSync(stadiumsFile, JSON.stringify(stadiums, null, 2) + '\n');
}

fixStadiums();
