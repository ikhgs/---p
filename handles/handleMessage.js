const { sendMessage } = require('./sendMessage');
const commandHandlers = require('../commands'); // Charge toutes les commandes dans le répertoire commands

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  try {
    // Extraire la commande et les arguments
    const [command, ...args] = messageText.split(' ');

    // Vérifier si une commande correspond au texte de l'utilisateur
    if (commandHandlers[command.toLowerCase()]) {
      // Exécuter la commande spécifiée
      const response = await commandHandlers[command.toLowerCase()].execute(senderId, args, pageAccessToken, sendMessage);
      
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
    } else {
      // Si aucune commande spécifique n'est trouvée, exécuter par défaut la commande 'par.js'
      const response = await commandHandlers['par'].execute(senderId, [messageText], pageAccessToken, sendMessage);

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

// Fonction pour diviser un message en morceaux
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = { handleMessage };
