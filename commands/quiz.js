const axios = require('axios');

// Un état pour stocker les informations de l'utilisateur
const userStates = {};

module.exports = {
  name: 'quiz',
  description: 'Fetch quiz categories and handle quiz questions',
  author: 'Bruno',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      // Vérifiez si l'utilisateur est en mode quiz
      if (userStates[senderId] && userStates[senderId].inQuiz) {
        await handleQuizQuestion(senderId, args, pageAccessToken, sendMessage);
        return;
      }

      // Si l'utilisateur n'est pas en mode quiz, commencer la sélection de catégorie
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

      sendMessage(senderId, { text: message }, pageAccessToken);

      // Enregistrer les catégories dans l'état de l'utilisateur
      userStates[senderId] = {
        categories,
        categoryChosen: false,
        inQuiz: false
      };
    } catch (error) {
      console.error('Error fetching quiz categories:', error.message);
      sendMessage(senderId, { text: 'Une erreur est survenue lors de la récupération des catégories de quiz.' }, pageAccessToken);
    }
  }
};

// Fonction pour gérer les questions après que l'utilisateur ait sélectionné une catégorie
async function handleQuizQuestion(senderId, args, pageAccessToken, sendMessage) {
  try {
    const userState = userStates[senderId];

    if (!userState.categoryChosen) {
      // Vérifier si un numéro de catégorie est fourni
      const categoryIndex = parseInt(args[0]) - 1;
      if (categoryIndex < 0 || categoryIndex >= userState.categories.length) {
        return sendMessage(senderId, { text: 'Numéro de catégorie invalide. Veuillez essayer à nouveau.' }, pageAccessToken);
      }

      // Stocker la catégorie choisie
      const chosenCategory = userState.categories[categoryIndex];
      userState.categoryChosen = true;
      userState.chosenCategory = chosenCategory;
      userState.inQuiz = true;

      // Envoyer la première question de quiz
      await sendNextQuizQuestion(senderId, userState, pageAccessToken, sendMessage);
    } else {
      // Traiter la réponse de l'utilisateur
      await processAnswer(senderId, args[0], pageAccessToken, sendMessage);
    }
  } catch (error) {
    console.error('Error handling quiz question:', error.message);
    sendMessage(senderId, { text: 'Une erreur est survenue lors du traitement de la question.' }, pageAccessToken);
  }
}

// Fonction pour envoyer la prochaine question de quiz
async function sendNextQuizQuestion(senderId, userState, pageAccessToken, sendMessage) {
  try {
    const quizUrl = `https://opentdb.com/api.php?amount=1&category=${userState.chosenCategory.id}&type=multiple`;
    const quizResponse = await axios.get(quizUrl);
    const questionData = quizResponse.data.results[0];

    if (!questionData || !questionData.incorrect_answers || !questionData.correct_answer) {
      throw new Error('Données de question manquantes');
    }

    const quizAnswers = [...questionData.incorrect_answers, questionData.correct_answer];
    quizAnswers.sort(() => Math.random() - 0.5); // Mélanger les réponses

    let questionMessage = `Voici une question dans la catégorie: ${userState.chosenCategory.name}\n${questionData.question}\n\n`;
    quizAnswers.forEach((answer, index) => {
      questionMessage += `${index + 1}- ${answer}\n`;
    });

    sendMessage(senderId, { text: questionMessage }, pageAccessToken);

    userState.correctAnswer = questionData.correct_answer;
    userState.answers = quizAnswers;
    userState.questionAsked = true;

  } catch (error) {
    console.error('Error sending quiz question:', error.message);
    sendMessage(senderId, { text: 'Une erreur est survenue lors de l\'envoi de la question de quiz.' }, pageAccessToken);
  }
}

// Fonction pour traiter la réponse à la question
async function processAnswer(senderId, answer, pageAccessToken, sendMessage) {
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

    // Envoyer la prochaine question automatiquement
    await sendNextQuizQuestion(senderId, userState, pageAccessToken, sendMessage);

  } catch (error) {
    console.error('Error processing answer:', error.message);
    sendMessage(senderId, { text: 'Une erreur est survenue lors du traitement de la réponse.' }, pageAccessToken);
  }
}

// Fonction pour arrêter le quiz
module.exports.stopQuiz = function(senderId) {
  if (userStates[senderId]) {
    userStates[senderId] = { categories: userStates[senderId].categories };
  }
};
