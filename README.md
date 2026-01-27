# research-seminar
**Prompt**

I created an app and deployed it on GitHub. This app should analyze random product reviews from a TSV file (reviews_test.tsv) using Hugging Face Inference API with a sentiment analysis model. Apart from a TSV the app consists of app.js and index.html. However I found out that my app loads fake data instead of the one from the TSV file. Here is a part of the code in app.js where the mistake occurs:

// Load and parse the TSV file using Papa Parse
function loadReviews() {
    fetch('reviews_test.tsv')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load TSV file');
            return response.text();
        })
        .then(tsvData => {
            Papa.parse(tsvData, {
                header: true,
                delimiter: '\t',
                complete: (results) => {
                    reviews = results.data
                        .map(row => row.text)
                        .filter(text => text && text.trim() !== '');
                    console.log('Loaded', reviews.length, 'reviews');
                },
                error: (error) => {
                    console.error('TSV parse error:', error);
                    showError('Failed to parse TSV file: ' + error.message);
                }
            });
        })
        .catch(error => {
            console.error('TSV load error:', error);
            showError('Failed to load TSV file: ' + error.message);
        });
}

The TSV file includes columns with the following headers: sentiment	productId	userId	summary	text	helpfulY	helpfulN. I need to load data from 'text' column. How do I fix the code so that it uses correct data from reviews_test.tsv and not fake one?
