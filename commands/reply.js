const axios = require('axios');

module.exports = {
  name: 'reply',
  description: 'Send a message to Cassidy Bot and get a reply',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      if (!args[0]) {
        return sendMessage(senderId, { text: 'Please provide a message to send.' }, pageAccessToken);
      }

      const userMessage = args.join(' ');
      const apiUrl = 'https://cassidybot.onrender.com/postWReply';

      const response = await axios.post(apiUrl, { text: userMessage });

      if (response.data && response.data.reply) {
        const botReply = response.data.reply;

        // Split the response into chunks if it exceeds 2000 characters
        const maxMessageLength = 2000;
        if (botReply.length > maxMessageLength) {
          const messages = splitMessageIntoChunks(botReply, maxMessageLength);
          messages.forEach(message => sendMessage(senderId, { text: message }, pageAccessToken));
        } else {
          sendMessage(senderId, { text: botReply }, pageAccessToken);
        }
      } else {
        sendMessage(senderId, { text: 'No reply received from Cassidy Bot.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error sending message to Cassidy Bot:', error.message);
      sendMessage(senderId, { text: 'An error occurred while processing your request.' }, pageAccessToken);
    }
  }
};

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
