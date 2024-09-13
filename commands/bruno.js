const axios = require('axios');

module.exports = {
    name: "bruno",
    author: "Bruno",
    description: "Automatic Image/Text Response Bot",
    async execute({ api, event }) {
        const ADMIN_ID = "100041841881488"; // Utilise l'ID réel de l'administrateur
        let conversationHistory = {};
        let imageCache = {}; // Stocke temporairement les images par utilisateur

        const message = event.body.toLowerCase();
        const senderID = event.senderID;

        // Commandes administrateur pour activer/désactiver le bot
        if (message === "principe off" && senderID === ADMIN_ID) {
            api.botEnabled = false;
            return api.sendMessage("🚫 Le bot est maintenant désactivé.", event.threadID);
        } else if (message === "principe on" && senderID === ADMIN_ID) {
            api.botEnabled = true;
            return api.sendMessage("✅ Le bot est maintenant activé.", event.threadID);
        }

        // Si le bot est désactivé, ignore les messages
        if (!api.botEnabled && senderID !== ADMIN_ID) return;

        // Gérer les messages avec des images attachées
        if (event.attachments?.[0]?.type === "photo") {
            const imageUrl = event.attachments[0].url;
            imageCache[senderID] = imageUrl;
            return api.sendMessage("✨ Photo reçue avec succès ! Pouvez-vous ajouter un texte pour expliquer ce que vous voulez savoir à propos de cette photo ?", event.threadID);
        }

        let responseMessage;

        if (imageCache[senderID]) {
            const imageUrl = imageCache[senderID];
            responseMessage = await handleRequest(message, senderID, imageUrl, conversationHistory);
            delete imageCache[senderID]; // Nettoyer après la réponse
        } else {
            responseMessage = await handleRequest(message, senderID, null, conversationHistory);
        }

        api.sendMessage(responseMessage, event.threadID);
    }
};

async function handleRequest(prompt, customId, link, conversationHistory) {
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

    try {
        const res = await axios.post(`https://gemini-ap-espa-bruno.onrender.com/api/gemini`, data);
        conversationHistory[customId].lastResponse = res.data.message;

        const title = "🍟❤️𝔹𝕣𝕦𝕟𝕠 𝕀𝔸 𝔼𝕊ℙ𝔸❤️🍟\n";
        let responseWithTitle = `${title}${res.data.message}`;
        return responseWithTitle;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}
