const { sendMessage } = require('./sendMessage');
const commandHandlers = require('../commands'); // Assure-toi que ce chemin est correct

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  try {
    console.log(`Received message: ${messageText}`);
    sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);

    const [command, ...args] = messageText.split(' ');

    if (commandHandlers[command]) {
      console.log(`Executing command: ${command}`);
      await commandHandlers[command].execute(senderId, args, pageAccessToken, sendMessage);
    } else {
      console.log(`Command not found, using Gemini AI for: ${messageText}`);
      const response = await callGeminiAPI(messageText);

      if (response.length > 2000) {
        const messages = splitMessageIntoChunks(response, 2000);
        for (const message of messages) {
          sendMessage(senderId, { text: message }, pageAccessToken);
        }
      } else {
        sendMessage(senderId, { text: response }, pageAccessToken);
      }
    }
  } catch (error) {
    console.error('Error handling message:', error.message);
    sendMessage(senderId, { text: 'An unexpected error occurred while processing your request.' }, pageAccessToken);
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
