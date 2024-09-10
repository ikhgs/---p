const axios = require('axios');

async function callParAPI(prompt) {
  try {
    const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${encodeURIComponent(prompt)}`;
    const response = await axios.get(apiUrl);
    return response.data.response;
  } catch (error) {
    throw new Error(`Par API call failed: ${error.message}`);
  }
}

module.exports = { callParAPI };
