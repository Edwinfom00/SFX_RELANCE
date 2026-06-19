const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'OMA TL - Quotations awaiting Customer Feedback.xlsx');
console.log('Reading Excel from:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  
  console.log('Total rows detected:', data.length);
  if (data.length > 0) {
    console.log('Columns / Keys in first row:');
    console.log(Object.keys(data[0]));
    console.log('\nFirst row content:');
    console.log(data[0]);
  } else {
    console.log('Excel sheet is empty.');
  }
} catch (err) {
  console.error('Error reading Excel:', err);
}
