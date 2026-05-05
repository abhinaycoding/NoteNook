const { Mistral } = require('@mistralai/mistralai');

async function testMistral() {
  const apiKey = "VnkXMMJvXC5vuXIHIqGAMiGJKFb8NsT7";
  const client = new Mistral({ apiKey });

  console.log("--- Testing Mistral Connection ---");
  try {
    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'test' }],
    });
    console.log("✅ Connection Successful!");
    console.log("Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("❌ Connection Failed!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.response) {
      console.error("HTTP Status:", err.response.status);
    }
  }
}

testMistral();
