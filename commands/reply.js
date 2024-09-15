const axios = require('axios');

module.exports = {
  name: 'historique',
  description: 'Fetch Wikipedia excerpt by page title',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      if (!args[0]) {
        return sendMessage(senderId, { text: 'Please provide a Wikipedia page title.' }, pageAccessToken);
      }

      const pageTitle = args[0];
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&format=json&exintro`;

      const response = await axios.get(apiUrl);

      const pages = response.data.query.pages;
      const page = Object.values(pages)[0];  // Get the first page from the response

      if (page.extract) {
        const resultMessage = page.extract;

        // Split the response into chunks if it exceeds 2000 characters
        const maxMessageLength = 2000;
        if (resultMessage.length > maxMessageLength) {
          const messages = splitMessageIntoChunks(resultMessage, maxMessageLength);
          for (const message of messages) {
            sendMessage(senderId, { text: message }, pageAccessToken);
          }
        } else {
          sendMessage(senderId, { text: resultMessage }, pageAccessToken);
        }
      } else {
        sendMessage(senderId, { text: `No excerpt found for the page titled "${pageTitle}".` }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching Wikipedia excerpt:', error.message);
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
