// Simple test to verify OpenAI API key
require('dotenv').config();

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

console.log('Testing OpenAI API key...');
console.log('API Key exists:', !!OPENAI_API_KEY);
console.log('API Key starts with:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 10) + '...' : 'N/A');

// Test the API key with a simple request
async function testAPI() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });
    
    if (response.ok) {
      console.log('✅ API key is valid!');
      const data = await response.json();
      console.log('Available models:', data.data.length);
    } else {
      console.log('❌ API key is invalid or expired');
      console.log('Status:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testAPI(); 