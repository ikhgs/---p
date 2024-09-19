const { sendMessage } = require('../handles/sendMessage');
const axios = require('axios');

module.exports = {
  name: "gemini",
  description: "Gère les interactions avec l'API Gemini.",
  execute: async (event, PAGE_ACCESS_TOKEN) => {
    try {
      // Vérifier si l'objet event contient bien l'ID de l'utilisateur
      if (!event || !event.sender || !event.sender.id) {
        throw new Error("L'ID de l'utilisateur est manquant ou indéfini.");
      }

      const senderId = event.sender.id;
      console.log(`Sender ID: ${senderId}`);

      // Si l'utilisateur n'a pas encore envoyé d'image, demander une photo
      if (!event.message || !event.message.attachments || event.message.attachments[0].type !== 'image') {
        await sendMessage(senderId, { text: "Envoyez-moi une photo, s'il vous plaît." }, PAGE_ACCESS_TOKEN);
        return;
      }

      // Récupérer l'URL de l'image envoyée par l'utilisateur
      const imageUrl = event.message.attachments[0].payload.url;
      console.log(`Image URL reçue : ${imageUrl}`);

      // Informer l'utilisateur que la photo est bien reçue
      await sendMessage(senderId, { text: "La photo est bien reçue. Je vais l'analyser." }, PAGE_ACCESS_TOKEN);

      // Appel à l'API externe pour envoyer l'image et obtenir une réponse
      const apiResponse = await axios.post('https://gemini-ap-espa-bruno.onrender.com/api/gemini', {
        prompt: 'Décrire cette image',
        customId: senderId,
        link: imageUrl
      });

      // Envoyer la réponse de l'API à l'utilisateur
      const apiMessage = apiResponse.data.message;
      await sendMessage(senderId, { text: apiMessage }, PAGE_ACCESS_TOKEN);

    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande gemini :", error.message);

      // Si une erreur se produit, envoyer un message d'erreur à l'utilisateur
      if (event && event.sender && event.sender.id) {
        await sendMessage(event.sender.id, { text: "Il y a eu une erreur lors du traitement de votre demande." }, PAGE_ACCESS_TOKEN);
      }
    }
  }
};
