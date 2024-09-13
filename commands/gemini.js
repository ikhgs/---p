const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  name: 'gemini',
  description: 'Respond to the photo sent by the user and continue the discussion based on it',
  author: 'Bruno',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      // Check if the message contains an image
      if (!args[0] || !args[0].imageUrl) {
        return sendMessage(senderId, { text: 'Please send a photo for analysis.' }, pageAccessToken);
      }

      const imageUrl = args[0].imageUrl;

      // Download the image
      const imagePath = await downloadImage(imageUrl);
      if (!imagePath) {
        return sendMessage(senderId, { text: 'Failed to download image.' }, pageAccessToken);
      }

      // Upload the image to Gemini for analysis
      const file = await uploadToGemini(imagePath);
      if (!file) {
        return sendMessage(senderId, { text: 'Failed to upload image to Gemini.' }, pageAccessToken);
      }

      // Create a prompt based on the image analysis
      const requestPayload = {
        prompt: `Analyze the content of this image.`,
        customId: senderId,
        link: imageUrl
      };

      // Send the request to your Gemini API
      const apiUrl = `https://gemini-ap-espa-bruno.onrender.com/api/gemini`;
      const response = await axios.post(apiUrl, requestPayload);

      if (response.data && response.data.message) {
        // Send the analysis result to the user
        const resultMessage = response.data.message;

        // Split the response into chunks if it exceeds 2000 characters
        const maxMessageLength = 2000;
        if (resultMessage.length > maxMessageLength) {
          const messages = splitMessageIntoChunks(resultMessage, maxMessageLength);
          for (const message of messages) {
            sendMessage(senderId, { text: message }, pageAccessToken);
          }
        } else {
          sendMessage(senderId, { text: resultMessage }, pageAccessToken);
        }

        // Save the image path and the response for continued discussion
        // Here you might want to save this information in a session or a database
        // For simplicity, this is just an example
        sessions[senderId] = {
          lastImage: imagePath,
          lastResponse: resultMessage
        };

      } else {
        sendMessage(senderId, { text: 'Could not analyze the image.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing image:', error.message);
      sendMessage(senderId, { text: 'An error occurred while processing your image.' }, pageAccessToken);
    }
  }
};

// Function to download an image from a URL
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  if (response.status === 200) {
    const tempFilePath = path.join(__dirname, `${uuidv4()}.jpg`);
    response.data.pipe(fs.createWriteStream(tempFilePath));
    return new Promise((resolve, reject) => {
      response.data.on('end', () => resolve(tempFilePath));
      response.data.on('error', (err) => reject(err));
    });
  } else {
    return null;
  }
}

// Function to upload the image to Gemini
async function uploadToGemini(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post('https://gemini-ap-espa-bruno.onrender.com/api/upload', form, {
      headers: form.getHeaders()
    });
    return response.data.file; // Adjust this according to the actual response format from Gemini
  } catch (error) {
    console.error('Error uploading image to Gemini:', error.message);
    return null;
  }
}

// Function to split a message into chunks
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
