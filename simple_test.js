// Test simple OpenAI query
const { testBasicOpenAIQuery } = require('./src/services/openai');

async function testSimpleQuery() {
  try {
    const prompt = "calories and macros half grilled chicken - short answer";
    
    console.log('TESTING PROMPT:');
    console.log('"' + prompt + '"');
    console.log('='.repeat(50));
    
    const result = await testBasicOpenAIQuery(prompt);
    
    console.log('OPENAI RESULT:');
    console.log(result);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleQuery();