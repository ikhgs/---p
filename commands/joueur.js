const axios = require('axios');
const MAX_LENGTH = 500;

async function translateText(text, targetLang = 'fr', sourceLang = 'en') {
  let translatedText = '';
  try {
    const segments = [];
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
      segments.push(text.slice(i, i + MAX_LENGTH));
    }
    for (const segment of segments) {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: segment,
          langpair: `${sourceLang}|${targetLang}`
        }
      });
      translatedText += response.data.responseData.translatedText;
    }
  } catch (error) {
    console.error('Erreur de traduction:', error.message);
    return text; // Retourner le texte original en cas d'erreur
  }
  return translatedText;
}

module.exports = {
  name: 'joueur',
  description: '{p}quiz',
  author: "Bruno",
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      // Récupérer la liste des catégories depuis l'API OpenTDB
      const categoriesResponse = await axios.get('https://opentdb.com/api_category.php');
      const categories = categoriesResponse.data.trivia_categories;

      // Créer un message listant les catégories disponibles avec des numéros
      let message = "Choisissez une catégorie de quiz en répondant avec le numéro correspondant:\n";
      categories.forEach((category, index) => {
        message += `${index + 1}- ${category.name}\n`;
      });

      // Traduire le message en français
      const translatedMessage = await translateText(message);

      // Envoyer le message contenant les catégories
      sendMessage(senderId, { text: translatedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error fetching quiz categories:', error.message);
      sendMessage(senderId, { text: "Une erreur est survenue lors de la récupération des catégories de quiz." }, pageAccessToken);
    }
  }
};
