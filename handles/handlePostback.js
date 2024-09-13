const { sendMessage } = require('./sendMessage');

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  // Vérifier le payload du bouton "Démarrer"
  if (payload === 'Démarrer') {
    // Envoyer un message de bienvenue à l'utilisateur
    const welcomeMessage = {
      text: "Bienvenue sur notre bot ! Comment puis-je vous aider aujourd'hui ?"
    };
    sendMessage(senderId, welcomeMessage, pageAccessToken);
  } else {
    // Gérer d'autres postbacks ici si nécessaire
    sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
