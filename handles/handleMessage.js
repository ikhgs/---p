const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

const commands = new Map();

// Load all command modules dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name, command);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase().trim();

  // Check if the message matches the command pattern for `par.js`
  if (commands.has('par') && messageText) {
    const command = commands.get('par');
    try {
      await command.execute(senderId, [messageText], pageAccessToken, sendMessage);
      return; // Exit after handling the `par` command to avoid further processing
    } catch (error) {
      console.error(`Error executing command 'par':`, error);
      // Ne pas envoyer de message d'erreur générique ici
      return; // Exit after handling the error
    }
  }

  // Handle other commands (e.g., `help`, `Spotify`)
  const args = messageText.split(' ');
  const commandName = args.shift();

  if (commands.has(commandName)) {
    const command = commands.get(commandName);
    try {
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      // Ne pas envoyer de message d'erreur générique ici
    }
  }
}

module.exports = { handleMessage };
