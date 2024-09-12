const axios = require('axios');

module.exports = {
  name: 'quiz',
  description: 'Fetch a random quiz question from the Open Trivia Database',
  author: '🏖️ Quiz IA 🏝️',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Vérifier si l'utilisateur a déjà une question en cours
    if (global.QuizContext && global.QuizContext[senderId] && global.QuizContext[senderId].correctAnswer) {
      // Si une réponse est attendue, on vérifie si l'utilisateur a répondu
      const userAnswer = parseInt(args[0], 10); // Convertir la réponse de l'utilisateur en nombre

      if (!isNaN(userAnswer) && userAnswer >= 1 && userAnswer <= 4) {
        // Vérifier la réponse
        return this.checkAnswer(senderId, userAnswer, pageAccessToken, sendMessage);
      } else {
        sendMessage(senderId, { text: 'Veuillez répondre avec un numéro entre 1 et 4 pour sélectionner une option.' }, pageAccessToken);
        return;
      }
    }

    // Envoyer un message d'attente pour le quiz
    sendMessage(senderId, { text: "🏖️ Quiz IA 🏝️ vous prépare une question, veuillez patienter..." }, pageAccessToken);

    try {
      // Appel à l'API Open Trivia Database pour obtenir une question aléatoire
      const apiUrl = 'https://opentdb.com/api.php?amount=1&type=multiple';
      const response = await axios.get(apiUrl);

      if (response.data && response.data.results && response.data.results.length > 0) {
        const quizData = response.data.results[0];
        const question = quizData.question;
        const correctAnswer = quizData.correct_answer;
        const incorrectAnswers = quizData.incorrect_answers;

        // Mélanger les réponses (correcte et incorrectes)
        const allAnswers = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);

        // Créer le message du quiz
        const quizMessage = `🏖️ Quiz IA 🏝️\n\nQuestion: ${question}\n\nOptions:\n${allAnswers.map((ans, index) => `${index + 1}. ${ans}`).join('\n')}`;

        // Envoyer la question du quiz
        sendMessage(senderId, { text: quizMessage }, pageAccessToken);

        // Stocker la réponse correcte pour vérifier plus tard
        global.QuizContext = global.QuizContext || {};
        global.QuizContext[senderId] = {
          correctAnswer: correctAnswer,
          allAnswers: allAnswers // stocker les réponses pour plus de clarté
        };
      } else {
        sendMessage(senderId, { text: 'Impossible de récupérer une question de quiz pour le moment.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API:', error.message, error.response?.data);
      sendMessage(senderId, { text: 'Une erreur est survenue lors de la récupération de la question.' }, pageAccessToken);
    }
  },

  // Fonction pour vérifier la réponse de l'utilisateur
  checkAnswer(senderId, userAnswer, pageAccessToken, sendMessage) {
    const quizContext = global.QuizContext && global.QuizContext[senderId];

    if (!quizContext || !quizContext.correctAnswer) {
      sendMessage(senderId, { text: 'Il n’y a pas de question active pour le moment. Veuillez demander un quiz.' }, pageAccessToken);
      return;
    }

    // Comparer l'index de la réponse utilisateur avec l'index de la réponse correcte
    const correctAnswer = quizContext.correctAnswer;
    const selectedAnswer = quizContext.allAnswers[userAnswer - 1];
    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) {
      sendMessage(senderId, { text: '✅ Réponse correcte !' }, pageAccessToken);
    } else {
      sendMessage(senderId, { text: `❌ Réponse incorrecte. La bonne réponse était : ${correctAnswer}` }, pageAccessToken);
    }

    // Réinitialiser le contexte de l'utilisateur pour permettre un nouveau quiz
    delete global.QuizContext[senderId];
  }
};
