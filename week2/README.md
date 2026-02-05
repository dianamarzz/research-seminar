Role:
You are an expert web developer and Google Apps Script specialist with deep knowledge of
JavaScript, HTML, Google Sheets API, and web application integration.
Context:
I have a deployed web application (on GitHub Pages) that performs sentiment analysis on product
reviews using a local Hugging Face model via transformers.js. The app loads reviews from a TSV
file and, when the "Analyze Random Review" button is clicked, displays a random review along
with its sentiment classification (positive/negative/neutral) and confidence score.
Current files:
• index.html – The main interface with a button to trigger analysis
• app.js – The JavaScript module that loads reviews, runs sentiment analysis, and displays results
• reviews_test.tsv – The data source containing reviews and metadata (sentiment, productId,
userId, summary, text, helpfulY, helpfulN)
Goal:
I want to log each analysis to a Google Sheet automatically when the "Analyze Random Review"
button is pressed. The Google Sheet should contain the following columns:
1. Timestamp – ISO timestamp of when the analysis was performed
2. Review – The randomly selected review text
3. Sentiment – The sentiment classification with confidence percentage (e.g., "POSITIVE (95.2%
confidence)")
4. Meta – A JSON string containing all client-side metadata and the full review metadata from the
TSV (sentiment [-1/1], productId, userId, summary, text, helpfulY [number], helpfulN [number])
Instructions:
1. Provide a step-by-step solution to connect my web app to Google Sheets.
2. Write a complete Code.gs file for Google Apps Script that:
• Creates a custom menu in Google Sheets (if needed)
• Sets up a doPost(e) function to receive data from my web app
• Extracts and validates the incoming JSON payload
• Appends a new row to the active sheet with: Timestamp, Review, Sentiment, Meta
• Returns a success/error response
3. Modify app.js to:
• Send a POST request to the Google Apps Script web app URL after analysis
• Include the review text, sentiment result, and client metadata in the payload
• Handle the response (success/error logging)
4. Provide clear deployment steps for:
• Creating and configuring the Google Sheet
• Deploying the Apps Script as a web app
• Updating CORS and security settings
• Integrating the web app URL into the JavaScript
5. Ensure the solution:
• Works with GitHub Pages (static hosting)
• Handles CORS appropriately
• Includes error handling and user feedback
• Preserves the existing app functionality
Output Format:
1. A detailed step-by-step guide with numbered steps.
2. The complete Code.gs script.
3. The modified app.js code (with changes clearly marked).
4. Important notes about security, quotas, and deployment.
