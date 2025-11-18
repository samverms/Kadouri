const XLSX = require('xlsx');

const workbook = XLSX.readFile('Accounts.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Columns in Accounts.xlsx:');
console.log(data[0]);
console.log('\nFirst 3 rows of data:');
data.slice(0, 4).forEach((row, i) => {
  console.log(`Row ${i}:`, row);
});
