const { sendMessage } = require('./sendMessage');
const fs = require('fs');
const path = require('path');

// Charger dynamiquement toutes les commandes
const commandDirectory = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandDirectory).filter(file => file.endsWith('.js'));

const commandHandlers = {};

for (const file of commandFiles) {
  const command = require(path.join(commandDirectory, file));
  commandHandlers[command.name] = command;
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  try {
    // Déterminer si le message est une commande
    const [commandName, ...args] = messageText.split(' ');

    // Si une commande est spécifiée, traiter cette commande
    if (commandHandlers[commandName]) {
      await commandHandlers[commandName].execute(senderId, args, pageAccessToken, sendMessage);
    } else {
      // Sinon, traiter automatiquement la commande 'par'
      if (commandHandlers['par']) {
        await commandHandlers['par'].execute(senderId, [messageText], pageAccessToken, sendMessage);
      } else {
        sendMessage(senderId, { text: 'Sorry, I don\'t understand that command.' }, pageAccessToken);
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
