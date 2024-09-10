const { sendMessage } = require('./sendMessage');
const { callGeminiAPI } = require('../utils/callGeminiAPI');
const commandHandlers = require('../commands'); // Chemin corrigé

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  try {
    // Répond directement au texte du message
    sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);

    // Traitement des commandes spécifiques
    const [command, ...args] = messageText.split(' ');

    // Vérifier si la commande existe et l'exécuter
    if (commandHandlers[command]) {
      await commandHandlers[command].execute(senderId, args, pageAccessToken, sendMessage);
    } else {
      // Traitement de Gemini AI si la commande n'existe pas
      const response = await callGeminiAPI(messageText);

      // Diviser la réponse en morceaux si elle dépasse 2000 caractères
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
  } catch (error) {
    console.error('Error handling message:', error);
    sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = { handleMessage };
