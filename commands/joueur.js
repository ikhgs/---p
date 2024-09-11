module.exports = {
  name: 'joueur',
  description: '{p}quiz',
  author: "Bruno",
  // Fonction déclenchée lorsque la commande "joueur" est appelée
  async execute({ api, event, commandName }) {
    try {
      // Ajout du log pour vérifier le contenu de api
      console.log('api:', api);

      // Vérifier si l'objet 'api' est valide
      if (!api || typeof api.sendMessage !== 'function') {
        throw new Error("L'objet 'api' ou la méthode 'sendMessage' est manquante.");
      }

      // Lier explicitement la méthode sendMessage au contexte de api
      api.sendMessage = api.sendMessage.bind(api);

      // Récupérer la liste des catégories depuis l'API OpenTDB
      const categoriesResponse = await axios.get('https://opentdb.com/api_category.php');
      const categories = categoriesResponse.data.trivia_categories;

      let message = "Choisissez une catégorie de quiz en répondant avec le numéro correspondant:\n";
      categories.forEach((category, index) => {
        message += `${index + 1}- ${category.name}\n`;
      });

      const translatedMessage = await translateText(message);

      api.sendMessage(translatedMessage, event.threadID, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            categories 
          });
        } else {
          console.error("Erreur lors de l'envoi du message:", err.message);
        }
      });
    } catch (error) {
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
          quizAnswers.sort(() => Math.random() - 0.5);

          let questionMessage = `🍟🐔 Bruno va te jouer 🐔🐓\n\nCatégorie: ${chosenCategory.name}\n${questionData.question}\n\n`;
          quizAnswers.forEach((answer, index) => {
            questionMessage += `${index + 1}- ${answer}\n`;
          });

          const translatedQuestionMessage = await translateText(questionMessage);

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
            } else {
              console.error("Erreur lors de l'envoi du message de la question:", err.message);
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
      const userAnswerIndex = userResponse - 1;

      if (userAnswerIndex >= 0 && userAnswerIndex < answers.length) {
        const userAnswer = answers[userAnswerIndex];

        if (userAnswer === correctAnswer) {
          api.sendMessage("✅ Bonne réponse !", event.threadID);
        } else {
          api.sendMessage(`❌ Mauvaise réponse. La bonne réponse était: ${correctAnswer}`, event.threadID);
        }

        setTimeout(async () => {
          try {
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
              } else {
                console.error("Erreur lors de l'envoi de la prochaine question:", err.message);
              }
            });
          } catch (error) {
            console.error('Error fetching next quiz question:', error.message);
            api.sendMessage("Une erreur est survenue lors de la récupération de la question suivante.", event.threadID);
          }
        }, 3000);

      } else {
        api.sendMessage("Numéro de réponse invalide. Veuillez essayer à nouveau.", event.threadID);
      }
    } else {
      api.sendMessage("Réponse invalide. Veuillez essayer à nouveau.", event.threadID);
    }
  }
};
