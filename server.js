const express = require('express');
const cors = require('cors');
const gis = require('g-i-s');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

function googleImage(term) {
  return new Promise((resolve, reject) => {
    gis(term, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

app.get('/', (req, res) => {
  res.send('✅ Server is Live! (Google Images + YouTube)');
});

app.get('/api/search', async (req, res) => {
  const { q, type } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    let formattedResults = [];

    if (type === 'video') {
      const videoResult = await yts(q);
      const videos = videoResult.videos.slice(0, 30);

      formattedResults = videos.map(item => ({
        title: item.title,
        thumbnail: item.thumbnail,
        url: item.url,
        duration: item.timestamp,
        views: item.views,
        source: 'YouTube',
        isVideo: true
      }));

    } else {
      const images = await googleImage(q);
      
      formattedResults = images.slice(0, 80).map(item => ({
        title: 'Google Image',
        image: item.url,
        thumbnail: item.url,
        url: item.url,
        source: 'Google',
        isVideo: false
      }));
    }

    res.json({
      results: formattedResults,
      total: formattedResults.length,
      source: type === 'video' ? 'YouTube' : 'Google Images'
    });

  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Search Failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
