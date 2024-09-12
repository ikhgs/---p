const axios = require('axios');
const { downloadImage } = require('../utils/downloadImage'); // Assurez-vous que ce chemin est correct
const { callGeminiAPI } = require('../utils/callGeminiAPI'); // Assurez-vous que ce chemin est correct

module.exports = {
  name: 'gemini',
  description: 'Ask a question to the Gemini AI with optional image processing',
  author: 'ChatGPT',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    try {
      // Envoyer un message d'attente
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);

      // Vérifier si un message contient une image
      if (args.some(arg => arg.startsWith('http://') || arg.startsWith('https://'))) {
        const imageUrl = args.find(arg => arg.startsWith('http://') || arg.startsWith('https://'));
        
        // Télécharger l'image
        const imagePath = await downloadImage(imageUrl);

        // Appeler l'API Gemini avec l'image
        const response = await callGeminiAPI({ prompt, imagePath });

        // Gérer la réponse de l'API
        handleResponse(senderId, response, pageAccessToken, sendMessage);
      } else {
        // Appeler l'API Gemini avec uniquement le prompt
        const response = await callGeminiAPI({ prompt });

        // Gérer la réponse de l'API
        handleResponse(senderId, response, pageAccessToken, sendMessage);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

// Fonction pour gérer la réponse de l'API
function handleResponse(senderId, response, pageAccessToken, sendMessage) {
  const maxMessageLength = 2000;

  if (response.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(response, maxMessageLength);
    for (const message of messages) {
      sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    sendMessage(senderId, { text: response }, pageAccessToken);
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
