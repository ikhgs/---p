const axios = require('axios');

module.exports = {
  name: 'quiz',
  description: 'Fetch a random quiz question from the Open Trivia Database',
  author: '🏖️ Quiz IA 🏝️',

  async execute(senderId, args, pageAccessToken, sendMessage) {
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
          correctAnswer: correctAnswer
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
