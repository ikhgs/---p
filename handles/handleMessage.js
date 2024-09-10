const { sendMessage } = require('./sendMessage');
const { callGeminiAPI } = require('../utils/callGeminiAPI');
const commandHandlers = require('../commands'); // Import all command handlers

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim(); // Trim leading/trailing whitespace

  try {
    // Check if the message is a command or a prompt
    const [command, ...args] = messageText.split(' ');

    if (commandHandlers[command]) {
      // If the command exists, execute the command handler
      await commandHandlers[command].execute(senderId, args, pageAccessToken, sendMessage);
    } else {
      // Otherwise, treat it as a prompt for Gemini
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);
      const response = await callGeminiAPI(messageText);

      // Split the response into chunks if it exceeds 2000 characters
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
