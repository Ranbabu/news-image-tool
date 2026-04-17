const express = require('express');
const cors = require('cors');
const gis = require('g-i-s');

const app = express();
app.use(cors());

app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  if (!searchTerm) {
    return res.status(400).json({ error: 'Query is required' });
  }

  gis(searchTerm, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Search failed' });
    }
    // इमेजेस के लिंक निकाल रहे हैं
    const formattedResults = results.slice(0, 50).map(item => ({
      image: item.url
    }));
    res.json({ results: formattedResults });
  });
});

module.exports = app;
