const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { callGeminiAPI } = require('../utils/callGeminiAPI');

const commands = new Map();

// Charger dynamiquement tous les modules de commande
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name, command);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  // Traitement automatique pour Gemini (sans commande spécifique)
  if (!messageText.startsWith('lyrics') && !messageText.startsWith('command')) {
    try {
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);

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
    } catch (error) {
      console.error('Error handling message with Gemini:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  } else {
    // Traitement des commandes spécifiques
    const args = messageText.split(' ');
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      try {
        await command.execute(senderId, args, pageAccessToken, sendMessage);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
      }
    }
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
