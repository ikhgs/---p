const axios = require('axios');
let status = true;

module.exports = {
    name: "familyfeud",
    author: "LiANE @nealianacagara",
    description: "Family Feud prompt",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (!status) return; // Si status est faux, ne répond pas
    try {
      // Préfixes de l'événement
      const { prefix } = global.GoatBot.config;
      const event = {
        prefixes: ["?"],
        strictPrefix: true,
        body: `?${args.join(' ')}` // Construire le message en utilisant les arguments
      };

      // Envoyer une requête GET à l'API avec les paramètres de l'événement
      const response = await axios.get("https://cassidybot.onrender.com/postWReply", {
        params: {
          body: event.body
        }
      });

      // Extraire les données de la réponse
      const { result: { body, messageID }, status: estatus, result } = response.data;

      // Si le statut de la réponse est fail, arrêter
      if (estatus === "fail") {
        return;
      }

      // Répondre au message et stocker l'ID du message de réponse
      sendMessage(body, (_, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: 'familyfeud',
          author: senderId,
          result
        });
      });

    } catch (error) {
      console.error("Erreur dans la commande familyfeud:", error);
    }
  },

  // Exécuter de nouveau si une nouvelle interaction est détectée
  async continueInteraction(senderId, args, pageAccessToken, sendMessage) {
    if (!status) return;
    try {
      // Reprendre là où la dernière réponse s'est arrêtée
      const event = {
        prefixes: ["#$#$#$#$#$#$#$"], // Un autre préfixe pour différencier cette phase
        strictPrefix: true,
        body: args.join(' ') // Utiliser les arguments
      };

      // Requête à l'API pour obtenir une nouvelle réponse
      const response = await axios.get("https://cassidybot.onrender.com/postWReply", {
        params: {
          body: event.body
        }
      });

      // Extraire les données
      const { result: { body, messageID }, status: estatus, result } = response.data;

      // Si la requête échoue
      if (estatus === "fail") {
        return;
      }

      // Répondre au message avec la nouvelle réponse
      sendMessage(body, (_, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: 'familyfeud',
          author: senderId,
          result
        });
      });

    } catch (error) {
      console.error("Erreur dans la continuation de familyfeud:", error);
    }
  }
};
