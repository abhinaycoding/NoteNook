const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testConnection() {
  const API_KEY = "AIzaSyAre6USSZg1fEe2YLzRC0BTgwoIUrTQDKk";
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  console.log("--- Starting Gemini Detailed Diagnostics ---");
  
  try {
    console.log("Checking model availability...");
    // We can't easily list models with the client SDK in browser-like environments
    // but in Node we can try to fetch them if the key has permissions
    
    // Let's try gemini-1.0-pro (sometimes required for older keys)
    // and gemini-1.5-flash-8b
    const extras = ["gemini-1.0-pro", "gemini-1.5-flash-8b", "gemini-pro-vision"];
    
    for (const m of extras) {
      try {
         const model = genAI.getGenerativeModel({ model: m });
         const result = await model.generateContent("test");
         console.log(`✅ ${m} works!`);
      } catch (e) {
         console.log(`❌ ${m} fails: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("FATAL:", err.message);
  }
}

testConnection();
