module.exports = {
  name: "autoreact",
  author: "👭Bruno👩‍🏭",
  description: "Auto React",
  
  async execute({ event, api }) {
    // Liste des émojis à utiliser comme réactions
    const reactions = [
      "😘", "😂", "🤣", "🍟", "😎", "❤️", "💕", "🍓", "🍒", "💥", "👈", "🐔", "🐓", "🎉", 
      "👉", "⚾", "😍", "💗", "😗", "👍", "🥰", "🤩", "🥳", "😊", "😜", "🤪", "😛", "🥴", 
      "😹", "😻", "❤️", "♥️", "❣️", "💓", "💝", "💅", "🤼", "👷", "👸", "👩‍🚒", "👩‍🏫", 
      "👩‍🔧", "👩‍⚖️", "👩‍💼", "👩‍🏭", "👭", "💏", "👯", "👨‍❤️‍👨", "👩‍❤️‍👩", "🌺", 
      "💐", "💮", "🌾", "🍃", "🍂", "🌲", "🌵", "❄️"
    ];

    // Choisir un émoji aléatoire dans la liste des réactions
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];

    // Affiche le message reçu pour le débogage
    console.log("Message:", event.body);
    console.log("Reacting with:", randomReaction);

    // Ajoute la réaction aléatoire au message
    api.setMessageReaction(randomReaction, event.messageID, event.threadID, api);
  },
};
