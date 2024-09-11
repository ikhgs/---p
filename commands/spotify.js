const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: 'Get a Spotify link for a song',
  author: 'Deku (rest api)',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      console.log(`Searching Spotify for query: ${query}`);
      const apiUrl = `https://deku-rest-api-3ijr.onrender.com/spotify?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      console.log('Spotify API response:', response.data);

      const spotifyLink = response.data.result;

      if (spotifyLink) {
        console.log('Sending Spotify link:', spotifyLink);
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: spotifyLink,
              is_reusable: true
            }
          }
        }, pageAccessToken);
      } else {
        console.log('No Spotify link found');
        sendMessage(senderId, { text: 'Sorry, no Spotify link found for that query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error retrieving Spotify link:', error.message, error.response?.data);

      if (error.response) {
        sendMessage(senderId, { text: 'There was an issue with the Spotify API response.' }, pageAccessToken);
      } else if (error.request) {
        sendMessage(senderId, { text: 'There was an issue making the request to the Spotify API.' }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'An unexpected error occurred.' }, pageAccessToken);
      }
    }
  }
};
