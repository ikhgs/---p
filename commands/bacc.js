const axios = require('axios');

module.exports = {
  name: 'bacc',
  description: 'Fetch Bac results by candidate number',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      if (!args[0]) {
        return sendMessage(senderId, { text: 'Please provide a candidate number.' }, pageAccessToken);
      }

      const candidateNumber = args[0];
      const apiUrl = `https://bacc.univ-fianarantsoa.mg/api/search/num/${candidateNumber}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.count > 0) {
        // The API response contains a "message" field that can be sent directly to the user
        const resultMessage = response.data.message;

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
        sendMessage(senderId, { text: `No result found for candidate number ${candidateNumber}.` }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching Bac result:', error.message);
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
