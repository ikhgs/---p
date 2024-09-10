const axios = require('axios');

module.exports = {
  name: 'par',
  description: 'Fetch a response from Bruno based on a given prompt',
  author: 'Bruno',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      if (!args[0]) {
        return sendMessage(senderId, { text: 'Please provide a prompt for Bruno.' }, pageAccessToken);
      }

      const prompt = encodeURIComponent(args.join(" "));
      const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`;

      // Envoyer un message de patience
      sendMessage(senderId, { text: "Bruno vous répondra dans quelques instants, mais veuillez patienter..." }, pageAccessToken);

      // Faire la requête à l'API
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        // Envoyer la réponse
        sendMessage(senderId, { text: response.data.response }, pageAccessToken);
        
        // Stocker le contexte pour conversation continue
        global.ConversationContext = global.ConversationContext || {};
        global.ConversationContext[senderId] = {
          previousQuestion: args.join(" "),
          response: response.data.response
        };
      } else {
        sendMessage(senderId, { text: 'Unable to get a response from Bruno.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error making API request:', error.message, error.response?.data);
      sendMessage(senderId, { text: 'An error occurred while processing your request.' }, pageAccessToken);
    }
  }
};

// Fonction pour gérer la suite de la conversation
module.exports.continueConversation = async function(senderId, args, pageAccessToken, sendMessage) {
  const context = global.ConversationContext && global.ConversationContext[senderId];
  if (!context) {
    return sendMessage(senderId, { text: 'There is no active conversation to continue.' }, pageAccessToken);
  }

  let prompt = context.previousQuestion + " " + encodeURIComponent(args.join(" "));
  const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`;

  try {
    // Faire la requête avec le contexte de la conversation précédente
    const response = await axios.get(apiUrl);

    if (response.data && response.data.response) {
      // Envoyer la nouvelle réponse
      sendMessage(senderId, { text: response.data.response }, pageAccessToken);

      // Mettre à jour le contexte pour la suite de la conversation
      global.ConversationContext[senderId] = {
        previousQuestion: prompt,
        response: response.data.response
      };
    } else {
      sendMessage(senderId, { text: 'Unable to get a response from Bruno.' }, pageAccessToken);
    }
  } catch (error) {
    console.error('Error making API request:', error.message, error.response?.data);
    sendMessage(senderId, { text: 'An error occurred while processing your request.' }, pageAccessToken);
  }
};
