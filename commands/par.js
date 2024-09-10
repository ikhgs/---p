const { callParAPI } = require('../utils/callparAPI');

module.exports = {
  name: 'par',
  description: 'Ask a question to Bruno and handle the conversation',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ').trim();
    if (!prompt) {
      sendMessage(senderId, { text: 'Please provide a prompt for Bruno.' }, pageAccessToken);
      return;
    }

    try {
      sendMessage(senderId, { text: 'Bruno is processing your request. Please wait...' }, pageAccessToken);

      // Call the Par API
      const response = await callParAPI(prompt);

      // Split the response into chunks if it exceeds 2000 characters
      const maxMessageLength = 2000;
      if (response.length > maxMessageLength) {
        const messages = splitMessageIntoChunks(response, maxMessageLength);
        const messagePromises = messages.map(message => sendMessage(senderId, { text: message }, pageAccessToken));
        await Promise.all(messagePromises);
      } else {
        sendMessage(senderId, { text: response }, pageAccessToken);
      }

      // Save the message ID and context for future replies
      global.GoatBot.onReply.set(senderId, {
        commandName: 'par',
        previousQuestion: prompt, // Keep the previous question for context
      });

    } catch (error) {
      console.error('Error calling Par API:', error.message);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

// Function to split message into chunks
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
  }
    
