const express = require('express');
const cors = require('cors');
const gis = require('g-i-s');
const path = require('path'); // यह नया जोड़ा गया है

const app = express();
const PORT = process.env.PORT || 3000;

// CORS को इनेबल करें
app.use(cors());

// मुख्य पेज के लिए रूट - अब यह आपकी HTML फाइल लोड करेगा
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// इमेज सर्च के लिए मुख्य API रूट
app.get('/api/search', async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ error: 'कृपया सर्च कीवर्ड (q) डालें' });
  }

  try {
    // Google Images सर्च शुरू
    gis(q, (error, results) => {
      if (error) {
        console.error('GIS Error:', error);
        return res.status(500).json({ error: 'इमेज सर्च फेल हो गया' });
      }

      // टॉप 50 इमेजेस को फॉर्मेट कर रहे हैं
      const formattedResults = results.slice(0, 50).map(item => ({
        image: item.url,
        url: item.url
      }));

      // रिस्पॉन्स भेज रहे हैं
      res.json({
        results: formattedResults,
        total: formattedResults.length,
        query: q
      });
    });

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'सर्वर एरर', details: err.message });
  }
});

// Vercel के लिए ऐप को एक्सपोर्ट करना ज़रूरी है
module.exports = app;

// लोकल टेस्टिंग के लिए
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
