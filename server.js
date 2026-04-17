const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// मुख्य पेज के लिए रूट - आपकी HTML फाइल लोड करेगा
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
    // Google Vercel को ब्लॉक कर देता है, 
    // इसलिए हम Yahoo/Bing Images का इस्तेमाल कर रहे हैं (जो बेहतरीन और तेज़ काम करता है)
    const searchUrl = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(q)}`;
    
    // Node.js के नेटिव fetch का इस्तेमाल कर रहे हैं
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    const html = await response.text();

    // HTML कोड में से इमेजेस के लिंक निकालना
    const regex = /<img[^>]+src="([^">]+)"/g;
    let match;
    let images = [];

    while ((match = regex.exec(html)) !== null) {
        let imgUrl = match[1];
        // सिर्फ असली न्यूज़ इमेजेस लेना (वेबसाइट के लोगो आदि को हटाना)
        if (imgUrl.startsWith('http') && !imgUrl.includes('yahoo.com') && !imgUrl.includes('clear.gif')) {
            images.push({ image: imgUrl, url: imgUrl });
        }
    }

    // एक जैसी (Duplicate) इमेजेस को हटाना
    const uniqueImages = Array.from(new Set(images.map(a => a.image)))
        .map(image => ({ image: image, url: image }));

    // रिस्पॉन्स भेजना
    res.json({
      results: uniqueImages.slice(0, 50), // टॉप 50 इमेजेस
      total: uniqueImages.slice(0, 50).length,
      query: q
    });

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'सर्वर एरर, कृपया थोड़ी देर बाद प्रयास करें।' });
  }
});

// Vercel के लिए ऐप को एक्सपोर्ट करना
module.exports = app;

// लोकल टेस्टिंग के लिए
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
