const axios = require('axios');

// ID de l'administrateur (remplacez par le vrai ID)
const ADMIN_ID = "100041841881488"; // Remplacez par l'ID réel de l'administrateur

// Variable globale pour contrôler si le bot doit répondre
let botEnabled = true;  // Initialement activé

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};
let imageCache = {}; // Stocker l'image temporairement par utilisateur

// Fonction modifiée pour gérer l'historique complet
async function principe(prompt, customId, link = null) {
  try {
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

    const res = await axios.post(`https://app-likg.vercel.app/api/Gemini`, data); // Remplacé avec la nouvelle URL de l'API

    conversationHistory[customId].lastResponse = res.data.message;

    const title = "🍟❤️ Bruno IA ❤️🍟\n ";
    let responseWithTitle = `${title}${res.data.message}`;

    return responseWithTitle;
  } catch (error) {
    return `Erreur: ${error.message}`;
  }
}

module.exports = {
  name: 'principe',
  description: 'Automatic Image/Text Response Bot',
  author: 'Bruno',

  // Fonction exécutée lorsque la commande est appelée
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const message = args.join(" ").toLowerCase();

    // Vérification des commandes administrateur "principe off" et "principe on"
    if (message === "principe off" || message === "principe on") {
      if (senderId !== ADMIN_ID) {
        sendMessage(senderId, { text: "❌ Vous n'avez pas la permission d'utiliser cette commande." }, pageAccessToken);
        return;
      }

      if (message === "principe off") {
        botEnabled = false;
        sendMessage(senderId, { text: "🚫 Le bot est maintenant désactivé pour tous." }, pageAccessToken);
        return;
      } else if (message === "principe on") {
        botEnabled = true;
        sendMessage(senderId, { text: "✅ Le bot est maintenant activé pour tous." }, pageAccessToken);
        return;
      }
    }

    // Si le bot est désactivé, ne pas répondre, même à l'administrateur
    if (!botEnabled) {
      return;
    }

    let res;

    // Si une image est envoyée avec le message
    if (args[0] && args[0].includes('http')) {
      const imageUrl = args[0];
      imageCache[senderId] = imageUrl;

      res = "✨Photo reçue avec succès !✨\n Pouvez-vous ajouter un texte pour m'expliquer ce que vous voulez savoir à propos de cette photo ?";
      sendMessage(senderId, { text: res }, pageAccessToken);

    } else if (imageCache[senderId]) {
      const imageUrl = imageCache[senderId];
      res = await principe(message || "Merci pour l'image !", senderId, imageUrl);
      delete imageCache[senderId];
    } else {
      res = await principe(message || "hello", senderId);
    }

    // Envoyer la réponse à l'utilisateur si ce n'était pas déjà fait
    if (!imageCache[senderId]) {
      sendMessage(senderId, { text: res }, pageAccessToken);
    }
  }
};
