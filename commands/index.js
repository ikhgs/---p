const spotify = require('./spotify');
const gemini = require('./gemini');
const gpt4 = require('./gpt4');
const bacc = require('./bacc');
const help = require('./help');
// Ajoutez d'autres commandes ici

module.exports = {
  name: 'index',
  description: 'This is the index command that exposes other available commands such as Spotify, Gemini, GPT-4, Bac results, and Help.',
  credit: 'Bruno',
  commands: {
    spotify,
    gemini,
    gpt4,
    help,
    bacc,
    // Exposez d'autres commandes ici
  }
};
