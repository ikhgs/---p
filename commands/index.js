const spotify = require('./spotify');
const gemini = require('./gemini');
const gpt4 = require('./gpt4');
const bacc = require('./bacc');
const help = require('./help');
// Ajoutez d'autres commandes ici

module.exports = {
  spotify,
  gemini,
  gpt4,
  help,
  // Exposez d'autres commandes ici
};
