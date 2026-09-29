const fs = require('fs');
const xlsx = require('xlsx');

const dir = '/home/jimfleax/Downloads/Labs';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

const branches = new Set();
const otherFormats = new Set();

files.forEach(file => {
  const workbook = xlsx.readFile(`${dir}/${file}`);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  data.forEach(row => {
    const roll = row['Roll no.'] || row['Roll no'] || row['Roll No.'];
    if (roll && typeof roll === 'string') {
        const cleanRoll = roll.trim().toUpperCase();
        // Expected format: 2026BTCS188
        const match = cleanRoll.match(/^[0-9]+([A-Z]+)[0-9]+$/);
        if (match) {
            branches.add(match[1]);
        } else {
            otherFormats.add(cleanRoll);
        }
    }
  });
});

console.log("Found branch codes:", Array.from(branches));
console.log("Other formats:", Array.from(otherFormats));
