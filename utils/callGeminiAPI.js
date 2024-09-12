const axios = require('axios');

async function callGeminiAPI({ prompt, imagePath }) {
  try {
    const apiUrl = 'https://gemini-ap-espa-bruno.onrender.com/api/gemini';
    
    // Préparer les données à envoyer
    const data = { prompt };
    if (imagePath) {
      data.imagePath = imagePath;
    }

    const response = await axios.post(apiUrl, data);
    return response.data.message;
  } catch (error) {
    throw new Error(`Gemini API call failed: ${error.message}`);
  }
}

module.exports = { callGeminiAPI };
