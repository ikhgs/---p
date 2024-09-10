const axios = require("axios");

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};

// Fonction modifiée pour ajouter un titre à la réponse
async function binaire(prompt, customId, link = null) {
    try {
        // Initialiser l'historique pour l'utilisateur s'il n'existe pas
        if (!conversationHistory[customId]) {
            conversationHistory[customId] = [];
        }

        // Ajouter la nouvelle entrée (texte et/ou lien de l'image) à l'historique
        if (link) {
            conversationHistory[customId].push({ prompt: "Image reçue", link });
        } else {
            conversationHistory[customId].push({ prompt });
        }

        // Préparer les données pour l'API
        const data = {
            prompt,
            customId,
            link // Lien de l'image s'il est présent
        };

        // Faire la requête POST à l'API Flask
        const res = await axios.post(`https://app-j3tw.vercel.app/api/gemini`, data); // Remplace avec l'URL correcte de ton API

        // Ajouter le titre à la réponse
        const title = "❤️🍟Bruno IA ESPA🍟❤️ \n ";
        const responseWithTitle = `${title}${res.data.message}`;

        // Retourner le message de réponse avec le titre
        return responseWithTitle;
    } catch (error) {
        return error.message;
    }
}

module.exports = {
    config: {
        name: "binaire",
        author: "Bruno",
        version: "1.0.0",
        countDown: 5,
        role: 0,
        category: "ai",
        shortDescription: {
            en: "{p}binaire"
        }
    },

    // Fonction principale exécutée lors de l'appel de la commande
    async execute(senderId, args, pageAccessToken, sendMessage, messageReply = null) {
        try {
            let res;

            // Si une image est envoyée avec le message
            if (messageReply?.attachments?.[0]?.type === "photo") {
                // Le bot répond à l'image via l'API
                res = await binaire("Merci pour l'image ! Que voulez-vous savoir à propos de cette image ?", senderId, messageReply.attachments[0].url);
            } else {
                // Sinon, traitement normal du texte
                const prompt = args.join(" ") || "hello";
                res = await binaire(prompt, senderId);
            }

            // Envoyer la réponse au bot
            sendMessage(senderId, { text: res }, pageAccessToken);

        } catch (error) {
            console.error('Erreur lors du traitement de la commande binaire:', error.message);
            sendMessage(senderId, { text: 'Une erreur est survenue lors du traitement de votre demande.' }, pageAccessToken);
        }
    }
};
