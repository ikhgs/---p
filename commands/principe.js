const axios = require('axios');

// Stocker les images dans un objet pour chaque utilisateur
global.ImageStorage = global.ImageStorage || {};

module.exports = {
  name: 'prince',
  description: 'Process image and answer questions about it',
  author: 'Bruno',

  async execute(senderId, args, pageAccessToken, sendMessage, receivedImageUrl = null) {
    try {
      // 1. Vérification de la réception d'une image
      if (receivedImageUrl) {
        // Si une image est reçue, on la stocke dans la mémoire globale
        global.ImageStorage[senderId] = receivedImageUrl;

        // Envoyer un message pour confirmer la réception de l'image
        return sendMessage(senderId, { text: "Photo bien reçue ! Posez-moi des questions concernant cette photo." }, pageAccessToken);
      }

      // 2. Si l'utilisateur pose une question, vérifier si une image est déjà stockée
      if (!global.ImageStorage[senderId]) {
        return sendMessage(senderId, { text: "Veuillez d'abord envoyer une image avant de poser des questions." }, pageAccessToken);
      }

      if (args.length === 0) {
        return sendMessage(senderId, { text: 'Veuillez poser une question à propos de l\'image envoyée.' }, pageAccessToken);
      }

      const prompt = encodeURIComponent(args.join(" "));
      const imageUrl = global.ImageStorage[senderId]; // Récupérer l'image stockée

      // Envoyer un message de patience à l'utilisateur
      sendMessage(senderId, { text: "Bruno vous répondra dans quelques instants, mais veuillez patienter..." }, pageAccessToken);

      // 3. Appeler l'API Gemini avec l'image et la question
      const apiUrl = `https://gemini-ap-espa-bruno.onrender.com/api`;
      const requestBody = {
        prompt: prompt,
        image_url: imageUrl,
        sender_id: senderId
      };

      // Faire la requête à l'API Gemini
      const response = await axios.post(apiUrl, requestBody);

      // Vérification de la réponse de l'API
      if (response.data && response.data.response) {
        // Ajouter le titre à la réponse
        const message = `🇲🇬🍟Bruno IA ESPA🍟🇲🇬\n\n${response.data.response}`;

        // Envoyer la réponse avec le titre
        sendMessage(senderId, { text: message }, pageAccessToken);

        // Stocker le contexte pour conversation continue
        global.ConversationContext = global.ConversationContext || {};
        global.ConversationContext[senderId] = {
          previousQuestion: prompt,
          response: response.data.response
        };
      } else {
        sendMessage(senderId, { text: 'Impossible d\'obtenir une réponse concernant cette image.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error making API request:', error.message, error.response?.data);
      sendMessage(senderId, { text: 'Une erreur est survenue lors du traitement de votre demande.' }, pageAccessToken);
    }
  }
};
