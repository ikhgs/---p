const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

module.exports = {
  name: 'gemini',
  description: 'Process images and get responses from Gemini',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      if (!args[0]) {
        return sendMessage(senderId, { text: 'Please send a photo for analysis.' }, pageAccessToken);
      }

      const imagePath = args[0];

      const fileUrl = await uploadToGemini(imagePath);
      if (!fileUrl) {
        return sendMessage(senderId, { text: 'Failed to upload image to Gemini.' }, pageAccessToken);
      }

      const responseMessage = await getGeminiResponse(fileUrl);
      if (responseMessage) {
        sendMessage(senderId, { text: responseMessage }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Failed to get a response from Gemini.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error executing Gemini command:', error.message);
      sendMessage(senderId, { text: 'An error occurred while processing your request.' }, pageAccessToken);
    }
  }
};

async function uploadToGemini(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('https://gemini-ap-espa-bruno.onrender.com/api/upload', formData, {
      headers: formData.getHeaders()
    });

    if (response.data && response.data.fileUrl) {
      return response.data.fileUrl;
    }
    return null;
  } catch (error) {
    console.error('Error uploading image to Gemini:', error.message);
    return null;
  }
}

async function getGeminiResponse(fileUrl) {
  try {
    const response = await axios.post('https://gemini-ap-espa-bruno.onrender.com/api/gemini', {
      prompt: 'Describe the content of this image',
      customId: 'unique-session-id', // Générer un ID unique pour chaque session
      link: fileUrl
    });

    return response.data.message;
  } catch (error) {
    console.error('Error fetching response from Gemini:', error.message);
    return null;
  }
}
