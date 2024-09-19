const { sendMessage } = require('../handles/sendMessage');
const axios = require('axios');
const sessions = {}; // Stocker les images par session

module.exports = {
  name: 'gemini',
  description: 'Analyse une image et répond aux questions basées sur celle-ci.',
  
  execute(event, PAGE_ACCESS_TOKEN) {
    const senderId = event.sender.id;

    // Demander à l'utilisateur d'envoyer une photo
    if (!sessions[senderId]) {
      sendMessage(senderId, { text: "Envoyez-moi une photo, s'il vous plaît." }, PAGE_ACCESS_TOKEN);
      sessions[senderId] = { imageUrl: null };
      return;
    }

    // Vérifier si l'utilisateur a envoyé une image
    if (event.message && event.message.attachments && event.message.attachments[0].type === 'image') {
      const imageUrl = event.message.attachments[0].payload.url;
      sendMessage(senderId, { text: "La photo est bien reçue. Je vais analyser cette photo." }, PAGE_ACCESS_TOKEN);

      // Stocker l'image dans la session
      sessions[senderId].imageUrl = imageUrl;

      // Appel à l'API Gemini pour analyser l'image
      axios.post('https://gemini-ap-espa-bruno.onrender.com/api/gemini', {
        prompt: "Analyse cette image",
        link: imageUrl,
        customId: senderId
      }).then(response => {
        const message = response.data.message;
        sendMessage(senderId, { text: message }, PAGE_ACCESS_TOKEN);
      }).catch(error => {
        console.error('Erreur lors de l\'appel à l\'API Gemini :', error);
        sendMessage(senderId, { text: "Je n'ai pas pu analyser cette image pour l'instant." }, PAGE_ACCESS_TOKEN);
      });

    } else if (event.message && sessions[senderId].imageUrl) {
      // Utilisateur pose une question après avoir envoyé une image
      const userQuestion = event.message.text;

      // Appel à l'API Gemini avec la question de l'utilisateur et l'image
      axios.post('https://gemini-ap-espa-bruno.onrender.com/api/gemini', {
        prompt: userQuestion,
        link: sessions[senderId].imageUrl,
        customId: senderId
      }).then(response => {
        const message = response.data.message;
        sendMessage(senderId, { text: message }, PAGE_ACCESS_TOKEN);
      }).catch(error => {
        console.error('Erreur lors de l\'appel à l\'API Gemini :', error);
        sendMessage(senderId, { text: "Je n'ai pas pu répondre à votre question pour l'instant." }, PAGE_ACCESS_TOKEN);
      });
      
    } else {
      sendMessage(senderId, { text: "Envoyez-moi une image pour que je puisse répondre à vos questions." }, PAGE_ACCESS_TOKEN);
    }
  }
};
