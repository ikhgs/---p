const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadImage(url) {
  const response = await axios({ url, responseType: 'stream' });
  const filePath = path.resolve(__dirname, 'temp.jpg');
  response.data.pipe(fs.createWriteStream(filePath));
  return new Promise((resolve, reject) => {
    response.data.on('end', () => resolve(filePath));
    response.data.on('error', reject);
  });
}

module.exports = { downloadImage };
