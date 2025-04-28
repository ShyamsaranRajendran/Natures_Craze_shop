require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Validate API Key - Critical Security Improvement
const apiKey = "AIzaSyCbbqWLdNUTWJbGNUVNYzRdUf0ZKORlIR4";
// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey);

// Model configuration
const geminiConfig = {
  model: "gemini-1.5-pro-latest",
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ],
  generationConfig: {
    maxOutputTokens: 2000,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    stopSequences: ["*"] // Added to prevent runaway responses
  }
};

// Company configuration with improved structure
const companyConfig = {
  brand: {
    name: "Nature's Carze",
    industry: "Organic & Natural Products",
    values: [
      "100% natural ingredients",
      "Sustainable sourcing",
      "Chemical-free formulations",
      "Eco-friendly packaging"
    ]
  },
  products: {
    categories: [
      "Organic Foods",
      "Natural Skincare",
      "Herbal Supplements",
      "Eco-Friendly Home Products"
    ],
    examples: [
      "Cold-pressed organic oils",
      "Herbal immunity boosters",
      "Chemical-free skincare",
      "Natural sweeteners"
    ]
  },
  guidelines: {
    tone: "Friendly, knowledgeable, and passionate about natural living",
    restrictions: [
      "Never make medical claims",
      "Only state general wellness benefits",
      "When unsure, recommend consulting wellness experts"
    ],
    certifications: [
      "USDA Organic",
      "Cruelty-Free",
      "Vegan Certified"
    ]
  }
};

// Enhanced model initialization with error handling
const getGenerativeModel = () => {
  try {
    return genAI.getGenerativeModel({
      ...geminiConfig,
      systemInstruction: {
        role: "model",
        parts: [{
          text: `You are an AI assistant for ${companyConfig.brand.name}. ` +
                `Key guidelines: ${companyConfig.guidelines.tone}. ` +
                `Never make medical claims. Product categories: ` +
                `${companyConfig.products.categories.join(', ')}.`
        }]
      }
    });
  } catch (error) {
    console.error("Failed to initialize Gemini model:", error);
    throw new Error("Model initialization failed");
  }
};

module.exports = {
  genAI,
  getGenerativeModel,
  companyConfig,
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only' // Never use hardcoded in production
};