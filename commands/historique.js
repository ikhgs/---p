const axios = require('axios');

module.exports = {
  name: "historique",
  author: "Bruno", // API by Bruno
  description: "{p}historique",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");

    if (!searchQuery) {
      return sendMessage("Veuillez fournir une requête de recherche (par exemple, histoire de la guerre anglo-népalaise).");
    }

    try {
      const response = await axios.get(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`);

      if (response.data.title && response.data.extract) {
        const title = response.data.title;
        const extract = response.data.extract;
        sendMessage(`Informations sur "${title}" :\n${extract}`);
      } else {
        sendMessage(`Aucune information trouvée pour "${searchQuery}".`);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations historiques :", error);
      sendMessage("Une erreur est survenue lors de la récupération des informations historiques.");
    }
  }
};
