const axios = require('axios');
let status = true;

module.exports = {
    name: "familyfeud",
    author: "LiANE @nealianacagara",
    description: "Family Feud prompt",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (!status) return;
    try {
      // Préfixe par défaut si non fourni par une configuration globale
      const prefix = '?'; // Utiliser un préfixe statique ou par défaut

      // Préparer l'événement
      const event = {
        prefixes: [prefix],
        strictPrefix: true,
        body: `${prefix}${args.join(' ')}` // Construire le message avec les arguments
      };

      // Envoyer une requête GET à l'API
      const response = await axios.get("https://cassidybot.onrender.com/postWReply", {
        params: { body: event.body }
      });

      // Extraire les données de la réponse
      const { result: { body, messageID }, status: estatus, result } = response.data;

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
  }
};
