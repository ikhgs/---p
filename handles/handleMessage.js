const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

const commands = new Map();

// Charger tous les modules de commande dynamiquement
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name, command);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase().trim();

  // Vérifier si le message correspond au modèle de commande pour `par.js`
  if (commands.has('par') && messageText) {
    const command = commands.get('par');
    try {
      await command.execute(senderId, [messageText], pageAccessToken, sendMessage);
      return; // Sortir après le traitement de la commande `par`
    } catch (error) {
      console.error(`Error executing command 'par':`, error);
      return; // Sortir après la gestion de l'erreur
    }
  }

  // Gérer d'autres commandes (e.g., `help`, `Spotify`)
  const args = messageText.split(' ');
  const commandName = args.shift();

  if (commands.has(commandName)) {
    const command = commands.get(commandName);
    try {
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
    }
  }
}

module.exports = { handleMessage };
