const axios = require('axios');

// Un état pour stocker les informations de l'utilisateur
const userStates = {};

module.exports = {
  name: 'quiz',
  description: 'Fetch quiz categories and handle quiz questions',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      // Vérifiez si l'utilisateur a déjà sélectionné une catégorie
      if (userStates[senderId] && userStates[senderId].categoryChosen) {
        await handleQuizQuestion(senderId, userStates[senderId], args, pageAccessToken, sendMessage);
        return;
      }

      // Si l'utilisateur n'a pas encore choisi de catégorie
      const categoriesUrl = 'https://opentdb.com/api_category.php';
      const response = await axios.get(categoriesUrl);
      const categories = response.data.trivia_categories;

      if (!categories || categories.length === 0) {
        return sendMessage(senderId, { text: 'Aucune catégorie de quiz trouvée.' }, pageAccessToken);
      }

      // Envoyer la liste des catégories à l'utilisateur
      let message = 'Veuillez choisir une catégorie de quiz en répondant avec un numéro:\n';
      categories.forEach((category, index) => {
        message += `${index + 1}. ${category.name}\n`;
      });

      // Envoyer les catégories et stocker l'état de l'utilisateur
      sendMessage(senderId, { text: message }, pageAccessToken);

      // Enregistrer les catégories dans l'état de l'utilisateur
      userStates[senderId] = {
        categories,
        categoryChosen: false
      };
    } catch (error) {
      console.error('Error fetching quiz categories:', error.message);
      sendMessage(senderId, { text: 'Une erreur est survenue lors de la récupération des catégories de quiz.' }, pageAccessToken);
    }
  }
};

// Fonction pour gérer les questions après que l'utilisateur ait sélectionné une catégorie
async function handleQuizQuestion(senderId, userState, args, pageAccessToken, sendMessage) {
  try {
    // Vérifier si un numéro de catégorie est fourni
    const categoryIndex = parseInt(args[0]) - 1;
    if (categoryIndex < 0 || categoryIndex >= userState.categories.length) {
      return sendMessage(senderId, { text: 'Numéro de catégorie invalide. Veuillez essayer à nouveau.' }, pageAccessToken);
    }

    // Stocker la catégorie choisie
    const chosenCategory = userState.categories[categoryIndex];
    userState.categoryChosen = true;
    userState.chosenCategory = chosenCategory;

    // Appeler l'API pour obtenir une question de quiz dans la catégorie sélectionnée
    const quizUrl = `https://opentdb.com/api.php?amount=1&category=${chosenCategory.id}&type=multiple`;
    const quizResponse = await axios.get(quizUrl);
    const questionData = quizResponse.data.results[0];

    if (!questionData || !questionData.incorrect_answers || !questionData.correct_answer) {
      throw new Error('Données de question manquantes');
    }

    const quizAnswers = [...questionData.incorrect_answers, questionData.correct_answer];
    quizAnswers.sort(() => Math.random() - 0.5); // Mélanger les réponses

    let questionMessage = `Voici une question dans la catégorie: ${chosenCategory.name}\n${questionData.question}\n\n`;
    quizAnswers.forEach((answer, index) => {
      questionMessage += `${index + 1}- ${answer}\n`;
    });

    // Envoyer la question et attendre la réponse de l'utilisateur
    sendMessage(senderId, { text: questionMessage }, pageAccessToken);

    // Stocker les informations de la question pour traiter la réponse de l'utilisateur
    userState.correctAnswer = questionData.correct_answer;
    userState.answers = quizAnswers;
    userState.questionAsked = true;

  } catch (error) {
    console.error('Error fetching quiz question:', error.message);
    sendMessage(senderId, { text: 'Une erreur est survenue lors de la récupération de la question de quiz.' }, pageAccessToken);
  }
}

// Fonction pour traiter la réponse à la question
module.exports.processAnswer = async function(senderId, answer, pageAccessToken, sendMessage) {
  try {
    const userState = userStates[senderId];

    if (!userState || !userState.questionAsked) {
      return sendMessage(senderId, { text: 'Veuillez d\'abord poser une question de quiz.' }, pageAccessToken);
    }

    const userAnswerIndex = parseInt(answer) - 1;
    const userAnswer = userState.answers[userAnswerIndex];

    if (userAnswer === userState.correctAnswer) {
      sendMessage(senderId, { text: 'Bonne réponse ! 🎉' }, pageAccessToken);
    } else {
      sendMessage(senderId, { text: `Mauvaise réponse. La bonne réponse était: ${userState.correctAnswer}.` }, pageAccessToken);
    }

    // Réinitialiser l'état de l'utilisateur après la réponse
    userStates[senderId] = { categories: userState.categories };
  } catch (error) {
    console.error('Error processing answer:', error.message);
    sendMessage(senderId, { text: 'Une erreur est survenue lors du traitement de la réponse.' }, pageAccessToken);
  }
};
