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

  // Diviser le message en parties pour extraire la commande et les arguments
  const args = messageText.split(' ');
  const commandName = args.shift();

  // Vérifier si la commande est reconnue
  if (commands.has(commandName)) {
    const command = commands.get(commandName);
    try {
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      sendMessage(senderId, { text: 'There was an error executing your command.' }, pageAccessToken);
    }
  } else {
    // Si le message ne correspond à aucune commande connue, utiliser 'par' pour répondre automatiquement
    const defaultCommand = commands.get('par');
    if (defaultCommand) {
      try {
        await defaultCommand.execute(senderId, [messageText], pageAccessToken, sendMessage);
      } catch (error) {
        console.error('Error executing default command:', error);
        sendMessage(senderId, { text: 'There was an error processing your message.' }, pageAccessToken);
      }
    }
  }
}

module.exports = { handleMessage };
