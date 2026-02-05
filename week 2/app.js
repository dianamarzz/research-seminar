// app.js (ES module version using transformers.js for local sentiment classification)

import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js";

// Global variables
let reviews = [];
let apiToken = ""; // kept for UI compatibility, but not used with local inference
let sentimentPipeline = null; // transformers.js text-classification pipeline

// --- ADDED: Google Sheets Web App URL ---
// Replace with your actual Apps Script web app URL after deployment
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxRMOyaHOQ4WVZTA7pz2MBIJDN3LQ3o2UrlqRzHGe8ZlMaUIIBXvAZIgHlSLsPaFPIzwg/exec"; // Ends with /exec

// DOM elements
const analyzeBtn = document.getElementById("analyze-btn");
const reviewText = document.getElementById("review-text");
const sentimentResult = document.getElementById("sentiment-result");
const loadingElement = document.querySelector(".loading");
const errorElement = document.getElementById("error-message");
const apiTokenInput = document.getElementById("api-token");
const statusElement = document.getElementById("status"); // optional status label for model loading

// --- ADDED: Store current analysis data for logging ---
let currentAnalysisData = {
  review: "",
  sentiment: "",
  meta: {}
};

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  // Load the TSV file (Papa Parse)
  loadReviews();

  // Set up event listeners
  analyzeBtn.addEventListener("click", analyzeRandomReview);
  apiTokenInput.addEventListener("change", saveApiToken);

  // Load saved API token if exists (not used with local inference but kept for UI)
  const savedToken = localStorage.getItem("hfApiToken");
  if (savedToken) {
    apiTokenInput.value = savedToken;
    apiToken = savedToken;
  }

  // Initialize transformers.js sentiment model
  initSentimentModel();
});

// Initialize transformers.js text-classification pipeline with a supported model
async function initSentimentModel() {
  try {
    if (statusElement) {
      statusElement.textContent = "Loading sentiment model...";
    }

    // Use a transformers.js-supported text-classification model.
    // Xenova/distilbert-base-uncased-finetuned-sst-2-english is a common choice.
    sentimentPipeline = await pipeline(
      "text-classification",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
    );

    if (statusElement) {
      statusElement.textContent = "Sentiment model ready";
    }
  } catch (error) {
    console.error("Failed to load sentiment model:", error);
    showError(
      "Failed to load sentiment model. Please check your network connection and try again."
    );
    if (statusElement) {
      statusElement.textContent = "Model load failed";
    }
  }
}

// Load and parse the TSV file using Papa Parse
function loadReviews() {
  fetch("reviews_test.tsv")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load TSV file");
      }
      return response.text();
    })
    .then((tsvData) => {
      Papa.parse(tsvData, {
        header: true,
        delimiter: "\t",
        complete: (results) => {
          // Store full review objects, not just text
          reviews = results.data.filter(row => 
            typeof row.text === "string" && 
            row.text.trim() !== "" &&
            Object.keys(row).length > 0
          );
          console.log("Loaded", reviews.length, "reviews with metadata");
        },
        error: (error) => {
          console.error("TSV parse error:", error);
          showError("Failed to parse TSV file: " + error.message);
        },
      });
    })
    .catch((error) => {
      console.error("TSV load error:", error);
      showError("Failed to load TSV file: " + error.message);
    });
}

// Save API token to localStorage (UI compatibility; not used with local inference)
function saveApiToken() {
  apiToken = apiTokenInput.value.trim();
  if (apiToken) {
    localStorage.setItem("hfApiToken", apiToken);
  } else {
    localStorage.removeItem("hfApiToken");
  }
}

// Analyze a random review
async function analyzeRandomReview() {
  hideError();

  if (!Array.isArray(reviews) || reviews.length === 0) {
    showError("No reviews available. Please try again later.");
    return;
  }

  if (!sentimentPipeline) {
    showError("Sentiment model is not ready yet. Please wait a moment.");
    return;
  }

  const selectedReviewObj = reviews[Math.floor(Math.random() * reviews.length)];
  const selectedReview = selectedReviewObj.text;

  // Display the review
  reviewText.textContent = selectedReview;

  // Store for logging
  currentAnalysisData = {
    review: selectedReview,
    sentiment: "",
    meta: {
      ...selectedReviewObj, // Full TSV metadata
      client: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
      }
    }
  };

  // Show loading state
  loadingElement.style.display = "block";
  analyzeBtn.disabled = true;
  sentimentResult.innerHTML = ""; // Reset previous result
  sentimentResult.className = "sentiment-result"; // Reset classes

  try {
    // Call local sentiment model (transformers.js)
    const result = await analyzeSentiment(selectedReview);
    displaySentiment(result);
    
    // --- ADDED: Log to Google Sheets ---
    // Don't await this to avoid blocking the UI
    logToGoogleSheets().catch(error => {
      console.warn("Failed to log to Google Sheets:", error);
      // Don't show error to user - logging failure shouldn't disrupt analysis
    });
    
  } catch (error) {
    console.error("Error:", error);
    showError(error.message || "Failed to analyze sentiment.");
  } finally {
    loadingElement.style.display = "none";
    analyzeBtn.disabled = false;
  }
}

// Call local transformers.js pipeline for sentiment classification
async function analyzeSentiment(text) {
  if (!sentimentPipeline) {
    throw new Error("Sentiment model is not initialized.");
  }

  // transformers.js text-classification pipeline returns:
  // [{ label: 'POSITIVE', score: 0.99 }, ...]
  const output = await sentimentPipeline(text);

  if (!Array.isArray(output) || output.length === 0) {
    throw new Error("Invalid sentiment output from local model.");
  }

  // Wrap to match [[{ label, score }]] shape expected by displaySentiment
  return [output];
}

// Display sentiment result
function displaySentiment(result) {
  // Default to neutral if we can't parse the result
  let sentiment = "neutral";
  let score = 0.5;
  let label = "NEUTRAL";

  // Expected format: [[{label: 'POSITIVE', score: 0.99}]]
  if (
    Array.isArray(result) &&
    result.length > 0 &&
    Array.isArray(result[0]) &&
    result[0].length > 0
  ) {
    const sentimentData = result[0][0];

    if (sentimentData && typeof sentimentData === "object") {
      label =
        typeof sentimentData.label === "string"
          ? sentimentData.label.toUpperCase()
          : "NEUTRAL";
      score =
        typeof sentimentData.score === "number"
          ? sentimentData.score
          : 0.5;

      // Determine sentiment bucket
      if (label === "POSITIVE" && score > 0.5) {
        sentiment = "positive";
      } else if (label === "NEGATIVE" && score > 0.5) {
        sentiment = "negative";
      } else {
        sentiment = "neutral";
      }
    }
  }

  // Format sentiment string for logging
  const sentimentString = `${label} (${(score * 100).toFixed(1)}% confidence)`;
  currentAnalysisData.sentiment = sentimentString;

  // Update UI
  sentimentResult.classList.add(sentiment);
  sentimentResult.innerHTML = `
        <i class="fas ${getSentimentIcon(sentiment)} icon"></i>
        <span>${sentimentString}</span>
    `;
}

// --- ADDED: Log analysis data to Google Sheets ---
async function logToGoogleSheets() {
  // Check if URL is configured
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE") {
    console.warn("Google Sheets logging is not configured. Please set GOOGLE_SCRIPT_URL.");
    return;
  }

  try {
    // Prepare the payload
    const payload = {
      review: currentAnalysisData.review,
      sentiment: currentAnalysisData.sentiment,
      meta: currentAnalysisData.meta
    };

    // Send POST request to Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for cross-origin requests to Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    // Note: With 'no-cors' mode, we can't read the response
    // The data is still sent and logged by Google Apps Script
    console.log("Analysis data sent to Google Sheets");

  } catch (error) {
    console.error("Failed to send data to Google Sheets:", error);
    // Silently fail - don't disrupt user experience
  }
}

// Get appropriate icon for sentiment bucket
function getSentimentIcon(sentiment) {
  switch (sentiment) {
    case "positive":
      return "fa-thumbs-up";
    case "negative":
      return "fa-thumbs-down";
    default:
      return "fa-question-circle";
  }
}

// Show error message
function showError(message) {
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Hide error message
function hideError() {
  errorElement.style.display = "none";
}
