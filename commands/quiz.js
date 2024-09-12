const axios = require('axios');

module.exports = {
  name: 'quiz',
  description: 'Fetch a random quiz question from the Open Trivia Database',
  author: '🏖️ Quiz IA 🏝️',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Si l'utilisateur a déjà une question en cours, vérifier la réponse
    if (global.QuizContext && global.QuizContext[senderId] && global.QuizContext[senderId].waitingForAnswer) {
      const userAnswer = parseInt(args[0], 10); // La réponse de l'utilisateur
      const correctAnswer = global.QuizContext[senderId].correctAnswer;
      const correctIndex = global.QuizContext[senderId].correctIndex; // Index de la bonne réponse (1-4)

      // Vérifier si la réponse est valide (entre 1 et 4)
      if (isNaN(userAnswer) || userAnswer < 1 || userAnswer > 4) {
        return sendMessage(senderId, { text: 'Veuillez répondre avec un numéro entre 1 et 4 pour sélectionner une option.' }, pageAccessToken);
      }

      // Vérifier si la réponse est correcte
      if (userAnswer === correctIndex) {
        sendMessage(senderId, { text: 'Bonne réponse ! 🎉' }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `Mauvaise réponse. La bonne réponse était : ${correctAnswer}.` }, pageAccessToken);
      }

      // Réinitialiser l'état du quiz après la réponse
      global.QuizContext[senderId] = null;
      sendMessage(senderId, { text: "Envoyez 'quiz' pour une nouvelle question ou toute autre commande pour interagir." }, pageAccessToken);
      return;
    }

    // Si aucune question n'est en attente de réponse, générer une nouvelle question
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
        const correctIndex = allAnswers.indexOf(correctAnswer) + 1; // Index 1-based pour la bonne réponse
        global.QuizContext = global.QuizContext || {};
        global.QuizContext[senderId] = {
          correctAnswer: correctAnswer,
          correctIndex: correctIndex,
          waitingForAnswer: true // Indique que nous attendons une réponse
        };
      } else {
        sendMessage(senderId, { text: 'Impossible de récupérer une question de quiz pour le moment.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API:', error.message, error.response?.data);
      sendMessage(senderId, { text: 'Une erreur est survenue lors de la récupération de la question.' }, pageAccessToken);
    }
  }
};
