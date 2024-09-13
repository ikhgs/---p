const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const axios = require('axios');
const FormData = require('form-data');
let tempfile;
(async () => {
  tempfile = (await import('tempfile')).default;
})();


// Stocker les états d'activation des commandes pour chaque utilisateur
const commandStates = {};
const activeCommands = {};

// Charger tous les modules de commande dynamiquement
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name, command);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;

  if (event.message && event.message.attachments && event.message.attachments.length > 0) {
    const attachment = event.message.attachments[0];
    if (attachment.type === 'image') {
      const imageUrl = attachment.payload.url;
      const imagePath = await downloadImage(imageUrl);
      if (!imagePath) {
        return sendMessage(senderId, { text: 'Failed to download image.' }, pageAccessToken);
      }

      const geminiCommand = commands.get('gemini');
      if (geminiCommand) {
        try {
          await geminiCommand.execute(senderId, [imagePath], pageAccessToken, sendMessage);
        } catch (error) {
          console.error('Error executing Gemini command:', error);
          sendMessage(senderId, { text: 'An error occurred while processing your image.' }, pageAccessToken);
        }
      }

      // Clean up temporary file
      fs.unlinkSync(imagePath);
      return; // Ne pas continuer avec d'autres commandes si une image est traitée
    }
  }

  const messageText = event.message.text.toLowerCase().trim();

  // Initialiser l'état de la commande pour l'utilisateur s'il n'existe pas
  commandStates[senderId] = commandStates[senderId] || { active: true };
  activeCommands[senderId] = activeCommands[senderId] || null;

  // Diviser le message en parties pour extraire la commande et les arguments
  const args = messageText.split(' ');
  const commandName = args.shift();

  // Gérer la commande "stop" et "start"
  if (commandName === 'stop') {
    // Désactiver toutes les commandes pour l'utilisateur
    commandStates[senderId].active = false;
    activeCommands[senderId] = null;
    return sendMessage(senderId, { text: 'All commands have been stopped.' }, pageAccessToken);
  }

  if (commandName === 'start') {
    // Réactiver toutes les commandes pour l'utilisateur
    commandStates[senderId].active = true;
    return sendMessage(senderId, { text: 'All commands have been started.' }, pageAccessToken);
  }

  // Gérer les commandes spécifiques
  if (activeCommands[senderId]) {
    const command = commands.get(activeCommands[senderId]);
    if (command) {
      try {
        await command.execute(senderId, args, pageAccessToken, sendMessage);
      } catch (error) {
        console.error(`Error executing command ${activeCommands[senderId]}:`, error);
        sendMessage(senderId, { text: 'There was an error executing your command.' }, pageAccessToken);
      }
      return; // Ne pas continuer à vérifier d'autres commandes
    }
  }

  // Vérifier si une commande est activée pour l'utilisateur
  if (commandStates[senderId].active) {
    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      activeCommands[senderId] = commandName; // Activer la commande spécifique pour cet utilisateur
      try {
        await command.execute(senderId, args, pageAccessToken, sendMessage);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        sendMessage(senderId, { text: 'There was an error executing your command.' }, pageAccessToken);
      }
    } else {
      // Si le message ne correspond à aucune commande connue, utiliser 'gemini' pour répondre automatiquement
      const defaultCommand = commands.get('gemini');
      if (defaultCommand) {
        try {
          await defaultCommand.execute(senderId, [messageText], pageAccessToken, sendMessage);
        } catch (error) {
          console.error('Error executing default command:', error);
          sendMessage(senderId, { text: 'There was an error processing your message.' }, pageAccessToken);
        }
      }
    }
  } else {
    // Si les commandes sont désactivées, ne pas répondre
    sendMessage(senderId, { text: 'All commands are currently stopped.' }, pageAccessToken);
  }
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const tempPath = tempfile('.jpg');
    fs.writeFileSync(tempPath, response.data);
    return tempPath;
  } catch (error) {
    console.error('Error downloading image:', error.message);
    return null;
  }
}

module.exports = { handleMessage };
