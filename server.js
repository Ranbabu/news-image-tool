const express = require('express');
const cors = require('cors');
const gis = require('g-i-s');
const yts = require('yt-search');

const app = express();
app.use(cors());

// Google Image Search Function
function googleImage(term) {
  return new Promise((resolve, reject) => {
    gis(term, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

// API Route
app.get('/api/search', async (req, res) => {
  const { q, type } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'कृपया कोई हेडलाइन डालें' });
  }

  try {
    let formattedResults = [];

    if (type === 'video') {
      const videoResult = await yts(q);
      const videos = videoResult.videos.slice(0, 30);
      formattedResults = videos.map(item => ({
        title: item.title,
        image: item.thumbnail, // वेबसाइट पर दिखाने के लिए image की तरह भेजा
        url: item.url,
        source: 'YouTube'
      }));
    } else {
      const images = await googleImage(q);
      formattedResults = images.slice(0, 80).map(item => ({
        title: 'Google Image',
        image: item.url,
        url: item.url,
        source: 'Google'
      }));
    }

    res.json({ results: formattedResults });

  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'सर्वर से डेटा नहीं मिल पाया।', details: error.message });
  }
});

module.exports = app;
