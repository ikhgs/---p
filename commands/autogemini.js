const { callGeminiAPI } = require('../utils/callGeminiAPI');

module.exports = {
  name: 'autogemini',
  description: 'Automatically send any message to Gemini AI',
  author: 'ChatGPT',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' '); // Le message de l'utilisateur devient le prompt

    // Assurez-vous que le prompt n'est pas vide
    if (!prompt.trim()) {
      sendMessage(senderId, { text: 'Please provide a message to process.' }, pageAccessToken);
      return;
    }

    try {
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);
      const response = await callGeminiAPI(prompt);

      // Gestion des réponses longues
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
      console.error('Error calling Gemini API:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

// Fonction pour diviser un message en morceaux
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
