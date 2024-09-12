const axios = require('axios');
const fs = require('fs');
const path = require('path');
const downloadImage = require('./downloadImage'); // Fonction pour télécharger une image

module.exports = {
  name: 'gemini',
  description: 'Ask a question to the Gemini AI with an optional image',
  author: 'ChatGPT',

  async execute(senderId, args, pageAccessToken, sendMessage, imageUrl) {
    try {
      let prompt = args.join(' ');

      // Si une image est fournie, télécharger et envoyer l'image
      if (imageUrl) {
        const imagePath = await downloadImage(imageUrl);
        if (!imagePath) {
          return sendMessage(senderId, { text: 'Failed to download image. Please try again.' }, pageAccessToken);
        }
        prompt += ` Image URL: ${imageUrl}`;
      }

      // Envoyer un message d'attente
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);

      // Appeler l'API Gemini
      const response = await callGeminiAPI(prompt, imageUrl);

      // Si la réponse dépasse 2000 caractères, divisez-la en plusieurs morceaux
      const maxMessageLength = 2000;
      if (response.length > maxMessageLength) {
        const messages = splitMessageIntoChunks(response, maxMessageLength);
        for (const message of messages) {
          sendMessage(senderId, { text: message }, pageAccessToken);
        }
      } else {
        sendMessage(senderId, { text: response }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

// Fonction pour appeler l'API Gemini
async function callGeminiAPI(prompt, imageUrl) {
  try {
    const apiUrl = 'https://gemini-ap-espa-bruno.onrender.com/api/gemini';
    const payload = {
      prompt,
      link: imageUrl,
      customId: 'some_unique_id' // Identifier the user or session
    };
    const response = await axios.post(apiUrl, payload);
    return response.data.message;
  } catch (error) {
    throw new Error(`Gemini API call failed: ${error.message}`);
  }
}

// Fonction pour diviser un message en morceaux
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
