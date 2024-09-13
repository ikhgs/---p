const axios = require("axios");

module.exports = {
  name: "prince",  // Le nouveau nom de la commande
  author: "Bruno",
  description: "Automatic Image/Text Response Bot",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      // Vérification si une image ou un texte est envoyé
      if (!args[0] && !imageCache[senderId]) {
        return sendMessage(senderId, { text: 'Please provide an image or a text to continue.' }, pageAccessToken);
      }

      let res;

      // Si une image est envoyée avec le message
      if (event.attachments?.[0]?.type === "photo") {
        const imageUrl = event.attachments[0].url;
        imageCache[senderId] = imageUrl;

        res = "✨ Photo reçue avec succès ! ✨\n Pouvez-vous ajouter un texte pour m'expliquer ce que vous voulez savoir à propos de cette photo ?";
        sendMessage(senderId, { text: res }, pageAccessToken);
      } else if (imageCache[senderId]) {
        // Si une image a été envoyée précédemment
        const imageUrl = imageCache[senderId];
        res = await principe(args[0] || "Merci pour l'image !", senderId, imageUrl);
        delete imageCache[senderId];
      } else {
        // Si seulement du texte est envoyé
        res = await principe(args[0] || "hello", senderId);
      }

      // Si aucune image n'est en cache, envoyer la réponse du bot
      if (!imageCache[senderId]) {
        sendMessage(senderId, { text: res }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing request:', error.message);
      sendMessage(senderId, { text: 'An error occurred while processing your request.' }, pageAccessToken);
    }
  }
};

// Dictionnaire pour stocker l'image temporairement par utilisateur
let imageCache = {};

// Fonction principe modifiée pour gérer l'historique complet et envoyer les réponses
async function principe(prompt, customId, link = null) {
  try {
    // Dictionnaire pour stocker l'historique des conversations par utilisateur
    let conversationHistory = {};

    if (!conversationHistory[customId]) {
      conversationHistory[customId] = { prompts: [], lastResponse: "" };
    }

    if (link) {
      conversationHistory[customId].prompts.push({ prompt: "Image reçue", link });
    } else {
      conversationHistory[customId].prompts.push({ prompt });
    }

    let context = conversationHistory[customId].prompts.map(entry => entry.link ? `Image: ${entry.link}` : entry.prompt).join("\n");

    const data = {
      prompt: prompt,
      customId,
      link
    };

    const res = await axios.post(`https://gemini-ap-espa-bruno.onrender.com/api/gemini`, data); // URL de l'API

    conversationHistory[customId].lastResponse = res.data.message;

    const title = "🍟❤️ Bruno IA ❤️🍟\n ";
    let responseWithTitle = `${title}${res.data.message}`;

    return responseWithTitle;
  } catch (error) {
    return `Erreur: ${error.message}`;
  }
}
