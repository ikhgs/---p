const { callGeminiAPI } = require('../utils/callGeminiAPI');

module.exports = {
  // Suppression du préfixe 'autogemini' et modification pour accepter n'importe quel message
  async execute(senderId, message, pageAccessToken, sendMessage) {
    const prompt = message.trim(); // Utilisation directe du message envoyé par l'utilisateur

    // Vérification pour s'assurer que le message n'est pas vide
    if (!prompt) {
      sendMessage(senderId, { text: 'Please provide a valid input.' }, pageAccessToken);
      return;
    }

    try {
      // Confirmation au cas où la requête prend du temps
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);
      
      // Appel à l'API Gemini avec le message de l'utilisateur
      const response = await callGeminiAPI(prompt);

      // Si la réponse est trop longue, elle est divisée en plusieurs morceaux
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

// Fonction pour diviser un long message en plusieurs morceaux
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
