const axios = require("axios");

// ID de l'administrateur (remplacez par le vrai ID)
const ADMIN_ID = "100041841881488"; // Remplacez par l'ID réel de l'administrateur

// Variable globale pour contrôler si le bot doit répondre
let botEnabled = true;  // Initialement activé

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};
let imageCache = {}; // Stocker l'image temporairement par utilisateur

// Fonction modifiée pour gérer l'historique complet
async function prince(prompt, customId, link = null) {
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

        const res = await axios.post(`https://gemini-ap-espa-bruno.onrender.com/api/gemini`, data); // Remplacé avec la nouvelle URL de l'API

        conversationHistory[customId].lastResponse = res.data.message;

        const title = "🍟❤️ Bruno IA ❤️🍟\n ";
        let responseWithTitle = `${title}${res.data.message}`;

        return responseWithTitle;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}

module.exports = {
    name: "prince",  // Le nouveau nom de la commande
    author: "Bruno",
    Description: "Automatic Image/Text Response Bot",

    async execute({ event, api }) {
        const message = event.body?.toLowerCase();
        const senderID = event.senderID;

        // Vérification des commandes administrateur "principe off" et "principe on"
        if (message === "prince off" || message === "prince on") {
            if (senderID !== ADMIN_ID) {
                api.sendMessage("❌ Vous n'avez pas la permission d'utiliser cette commande.", event.threadID);
                return;
            }

            if (message === "prince off") {
                botEnabled = false;
                api.sendMessage("🚫 Le bot est maintenant désactivé pour tous.", event.threadID);
                return;
            } else if (message === "prince on") {
                botEnabled = true;
                api.sendMessage("✅ Le bot est maintenant activé pour tous.", event.threadID);
                return;
            }
        }

        // Si le bot est désactivé, ne pas répondre, même à l'administrateur
        if (!botEnabled) {
            return;
        }

        let res;

        // Si une image est envoyée avec le message
        if (event.attachments?.[0]?.type === "photo") {
            const imageUrl = event.attachments[0].url;
            imageCache[senderID] = imageUrl;

            res = "✨Photo reçue avec succès !✨\n Pouvez-vous ajouter un texte pour m'expliquer ce que vous voulez savoir à propos de cette photo ?";
            api.sendMessage(res, event.threadID);

        } else if (imageCache[senderID]) {
            const imageUrl = imageCache[senderID];
            res = await prince(message || "Merci pour l'image !", senderID, imageUrl);
            delete imageCache[senderID];
        } else {
            res = await prince(message || "hello", senderID);
        }

        // Envoyer la réponse à l'utilisateur si ce n'était pas déjà fait
        if (!imageCache[senderID]) {
            api.sendMessage(res, event.threadID);
        }
    }
};
