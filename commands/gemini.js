const axios = require('axios');

// Stockage des sessions de chaque utilisateur
const sessions = {};

// Fonction pour appeler l'API Gemini
async function callGeminiAPI(customId, prompt, imageUrl = null) {
  try {
    const response = await axios.post('https://gemini-ap-espa-bruno.onrender.com/api/gemini', {
      prompt: prompt,
      customId: customId,
      link: imageUrl
    });
    return response.data.message;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Sorry, an error occurred while processing your request.';
  }
}

module.exports = {
  name: 'gemini',
  description: 'Handle conversation with image processing using Gemini API',

  async execute(event, PAGE_ACCESS_TOKEN) {
    const senderId = event.sender.id;

    // Vérifier si c'est un message contenant une pièce jointe (image)
    if (event.message.attachments && event.message.attachments[0].type === 'image') {
      const imageUrl = event.message.attachments[0].payload.url;

      // Stocker l'image pour l'utilisateur
      if (!sessions[senderId]) {
        sessions[senderId] = { imageUrl: null, history: [] };
      }
      sessions[senderId].imageUrl = imageUrl;

      // Envoyer l'image à l'API Gemini et informer l'utilisateur
      const responseMessage = await callGeminiAPI(senderId, 'Analyse cette image', imageUrl);
      sessions[senderId].history.push({ role: 'user', message: 'Analyse cette image' });
      sessions[senderId].history.push({ role: 'bot', message: responseMessage });

      // Répondre à l'utilisateur
      sendMessage(senderId, responseMessage, PAGE_ACCESS_TOKEN);
    } else if (event.message.text) {
      // L'utilisateur pose une question après avoir envoyé une image
      const userMessage = event.message.text;

      // Si une image a été envoyée précédemment
      if (sessions[senderId] && sessions[senderId].imageUrl) {
        const responseMessage = await callGeminiAPI(senderId, userMessage, sessions[senderId].imageUrl);
        sessions[senderId].history.push({ role: 'user', message: userMessage });
        sessions[senderId].history.push({ role: 'bot', message: responseMessage });

        // Répondre à l'utilisateur
        sendMessage(senderId, responseMessage, PAGE_ACCESS_TOKEN);
      } else {
        // Si aucune image n'a été envoyée, informer l'utilisateur
        sendMessage(senderId, 'Veuillez d\'abord envoyer une image.', PAGE_ACCESS_TOKEN);
      }
    }
  }
};

// Fonction pour envoyer un message via l'API Facebook Messenger
function sendMessage(senderId, message, PAGE_ACCESS_TOKEN) {
  const requestBody = {
    recipient: { id: senderId },
    message: { text: message }
  };

  axios.post(`https://graph.facebook.com/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, requestBody)
    .then(() => {
      console.log('Message sent to user');
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
}
