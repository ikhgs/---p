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

    // Nouvelle version de execute
    async execute(senderId, args, pageAccessToken, sendMessage) {
        try {
            if (!args[0]) {
                return sendMessage(senderId, { text: 'Please provide a candidate number.' }, pageAccessToken);
            }

            // Gérer les autres cas en fonction des args reçus
            const message = args.join(" ").toLowerCase();

            // Vérification des commandes administrateur "prince off" et "prince on"
            if (message === "prince off" || message === "prince on") {
                if (senderId !== ADMIN_ID) {
                    return sendMessage(senderId, { text: "❌ Vous n'avez pas la permission d'utiliser cette commande." }, pageAccessToken);
                }

                if (message === "prince off") {
                    botEnabled = false;
                    return sendMessage(senderId, { text: "🚫 Le bot est maintenant désactivé pour tous." }, pageAccessToken);
                } else if (message === "prince on") {
                    botEnabled = true;
                    return sendMessage(senderId, { text: "✅ Le bot est maintenant activé pour tous." }, pageAccessToken);
                }
            }

            // Si le bot est désactivé, ne pas répondre
            if (!botEnabled) {
                return;
            }

            let res;

            // Si une image est envoyée avec le message (utilisation d'une condition d'image fictive ici)
            if (args.includes("photo")) {
                const imageUrl = "url-de-l-image"; // À remplacer par la gestion réelle des images
                imageCache[senderId] = imageUrl;

                res = "✨Photo reçue avec succès !✨\n Pouvez-vous ajouter un texte pour m'expliquer ce que vous voulez savoir à propos de cette photo ?";
                return sendMessage(senderId, { text: res }, pageAccessToken);
            } else if (imageCache[senderId]) {
                const imageUrl = imageCache[senderId];
                res = await prince(message || "Merci pour l'image !", senderId, imageUrl);
                delete imageCache[senderId];
            } else {
                res = await prince(message || "hello", senderId);
            }

            // Envoyer la réponse à l'utilisateur si ce n'était pas déjà fait
            if (!imageCache[senderId]) {
                sendMessage(senderId, { text: res }, pageAccessToken);
            }
        } catch (error) {
            sendMessage(senderId, { text: `Erreur: ${error.message}` }, pageAccessToken);
        }
    }
};
