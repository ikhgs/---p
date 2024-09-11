const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

// Charger toutes les commandes depuis le répertoire 'commands'
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
const commands = new Map();

for (const file of commandFiles) {
  const command = require(path.join(__dirname, '../commands', file));
  commands.set(command.name, command);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  try {
    // Répond directement au texte du message
    sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);

    // Traitement des commandes spécifiques
    const [commandName, ...args] = messageText.split(' ');

    // Vérifier si le message est une commande et non un texte libre
    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } else {
      // Si aucune commande spécifique, utiliser la commande 'par'
      const parCommand = commands.get('par');
      if (parCommand) {
        await parCommand.execute(senderId, messageText.split(' '), pageAccessToken, sendMessage);
      } else {
        // Réponse pour les commandes non reconnues
        sendMessage(senderId, { text: 'Unknown command. Please try again.' }, pageAccessToken);
      }
    }
  } catch (error) {
    console.error('Error handling message:', error.message);
    sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
  }
}

module.exports = { handleMessage };
