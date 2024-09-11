const axios = require('axios');

const MAX_LENGTH = 500; // Limite de longueur pour les requêtes MyMemory

// Fonction pour traduire un texte en morceaux
async function translateText(text, targetLang = 'fr', sourceLang = 'en') {
  let translatedText = '';

  try {
    // Diviser le texte en morceaux plus petits si nécessaire
    const segments = [];
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
      segments.push(text.slice(i, i + MAX_LENGTH));
    }

    // Traduire chaque morceau
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
  // Fonction déclenchée lorsque la commande "joueur" est appelée
  async execute({ api, event, commandName }) {
    try {
      // Récupérer la liste des catégories depuis l'API OpenTDB
      const categoriesResponse = await axios.get('https://opentdb.com/api_category.php');
      const categories = categoriesResponse.data.trivia_categories;

      // Créer un message listant les catégories disponibles avec des numéros
      let message = "Choisissez une catégorie de quiz en répondant avec le numéro correspondant:\n";
      categories.forEach((category, index) => {
        message += `${index + 1}- ${category.name}\n`; // Lister les catégories avec un index et "-"
      });

      // Traduire le message en français
      const translatedMessage = await translateText(message);

      // Envoyer le message contenant les catégories au thread
      api.sendMessage(translatedMessage, event.threadID, (err, info) => {
        if (!err) {
          // Enregistrer le message pour la gestion des réponses
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            categories // Enregistrer les catégories pour l'utilisation ultérieure
          });
        }
      });
    } catch (error) {
      // En cas d'erreur lors de la récupération des catégories, afficher un message d'erreur
      console.error('Error fetching quiz categories:', error.message);
      api.sendMessage("Une erreur est survenue lors de la récupération des catégories de quiz.", event.threadID);
    }
  },

  // Fonction déclenchée lorsque l'utilisateur répond avec une réponse à la question posée
  async handleReply({ api, event, Reply }) {
    const { author, categories, correctAnswer, answers, categoryId, categoryName } = Reply;

    if (author !== event.senderID) return;

    const userResponse = parseInt(event.body);

    if (categories) {
      // Gestion de la sélection de catégorie
      const categoryIndex = userResponse - 1;

      if (categoryIndex >= 0 && categoryIndex < categories.length) {
        const chosenCategory = categories[categoryIndex];
        const quizUrl = `https://opentdb.com/api.php?amount=1&category=${chosenCategory.id}&type=multiple`;

        try {
          const quizResponse = await axios.get(quizUrl);
          const questionData = quizResponse.data.results[0];

          if (!questionData || !questionData.incorrect_answers || !questionData.correct_answer) {
            throw new Error("Données de question manquantes");
          }

          const quizAnswers = [...questionData.incorrect_answers, questionData.correct_answer];
          quizAnswers.sort(() => Math.random() - 0.5); // Mélanger les réponses

          let questionMessage = `🍟🐔 Bruno va te jouer 🐔🐓\n\nCatégorie: ${chosenCategory.name}\n${questionData.question}\n\n`;
          quizAnswers.forEach((answer, index) => {
            questionMessage += `${index + 1}- ${answer}\n`; // Lister les réponses avec un index et "-"
          });

          // Traduire la question et les réponses en français
          const translatedQuestionMessage = await translateText(questionMessage);

          // Envoyer la question au thread
          api.sendMessage(translatedQuestionMessage, event.threadID, (err, info) => {
            if (!err) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: Reply.commandName,
                messageID: info.messageID,
                author: event.senderID,
                correctAnswer: questionData.correct_answer,
                answers: quizAnswers,
                categoryId: chosenCategory.id,
                categoryName: chosenCategory.name
              });
            }
          });
        } catch (error) {
          console.error('Error fetching quiz question:', error.message);
          api.sendMessage("Une erreur est survenue lors de la récupération de la question de quiz.", event.threadID);
        }
      } else {
        api.sendMessage("Numéro de catégorie invalide. Veuillez essayer à nouveau.", event.threadID);
      }
    } else if (answers && correctAnswer) {
      // Gestion de la réponse à une question de quiz
      const userAnswerIndex = userResponse - 1;

      if (userAnswerIndex >= 0 && userAnswerIndex < answers.length) {
        const userAnswer = answers[userAnswerIndex];

        if (userAnswer === correctAnswer) {
          api.sendMessage("✅ Bonne réponse !", event.threadID);
        } else {
          api.sendMessage(`❌ Mauvaise réponse. La bonne réponse était: ${correctAnswer}`, event.threadID);
        }

        // Attendre avant d'envoyer la prochaine question
        setTimeout(async () => {
          try {
            // Récupérer la prochaine question en utilisant l'ID de la catégorie
            const quizUrl = `https://opentdb.com/api.php?amount=1&category=${categoryId}&type=multiple`;
            const quizResponse = await axios.get(quizUrl);
            const nextQuestionData = quizResponse.data.results[0];

            if (!nextQuestionData || !nextQuestionData.incorrect_answers || !nextQuestionData.correct_answer) {
              throw new Error("Données de question manquantes");
            }

            const nextQuizAnswers = [...nextQuestionData.incorrect_answers, nextQuestionData.correct_answer];
            nextQuizAnswers.sort(() => Math.random() - 0.5);

            let questionMessage = `🍟🐔 Bruno va te jouer 🐔🐓\n\nCatégorie: ${categoryName}\n${nextQuestionData.question}\n\n`;
            nextQuizAnswers.forEach((answer, index) => {
              questionMessage += `${index + 1}- ${answer}\n`;
            });

            const translatedQuestionMessage = await translateText(questionMessage);

            api.sendMessage(translatedQuestionMessage, event.threadID, (err, info) => {
              if (!err) {
                global.GoatBot.onReply.set(info.messageID, {
                  commandName: Reply.commandName,
                  messageID: info.messageID,
                  author: event.senderID,
                  correctAnswer: nextQuestionData.correct_answer,
                  answers: nextQuizAnswers,
                  categoryId: categoryId,
                  categoryName: categoryName
                });
              }
            });
          } catch (error) {
            console.error('Error fetching next quiz question:', error.message);
            api.sendMessage("Une erreur est survenue lors de la récupération de la question suivante.", event.threadID);
          }
        }, 3000); // Attendre 3 secondes avant d'envoyer la prochaine question

      } else {
        api.sendMessage("Numéro de réponse invalide. Veuillez essayer à nouveau.", event.threadID);
      }
    } else {
      api.sendMessage("Réponse invalide. Veuillez essayer à nouveau.", event.threadID);
    }
  }
};
