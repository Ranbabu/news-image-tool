const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// मुख्य पेज के लिए रूट
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
    // हम Bing Images का इस्तेमाल कर रहे हैं (यह हिंदी न्यूज़ के लिए बेस्ट है और ब्लॉक नहीं होता)
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2`;
    
    // Bing से डेटा मँगवा रहे हैं
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7' // हिंदी रिज़ल्ट्स को प्राथमिकता
        }
    });

    const html = await response.text();

    // Magic Regex: यह कोड बिना किसी रुकावट के सीधे Bing के सर्वर से इमेजेस के लिंक निकाल लेता है
    const imgRegex = /https:\/\/tse[0-9]\.mm\.bing\.net\/th\?id=[^&"'\s]+/g;
    
    let match;
    let images = [];

    // HTML में जहाँ-जहाँ इमेज मिलेगी, उसे लिस्ट में डाल देंगे
    while ((match = imgRegex.exec(html)) !== null) {
        let imgUrl = match[0];
        images.push(imgUrl);
    }

    // एक जैसी (Duplicate) इमेजेस को हटाना
    const uniqueImages = [...new Set(images)].map(url => ({ image: url, url: url }));

    // अगर कोई इमेज नहीं मिलती है
    if (uniqueImages.length === 0) {
       return res.json({ error: "इस हेडलाइन से जुड़ी कोई इमेज नहीं मिली। कोई दूसरा कीवर्ड ट्राई करें।" });
    }

    // रिस्पॉन्स भेजना (टॉप 30 इमेजेस)
    res.json({
      results: uniqueImages.slice(0, 30),
      total: uniqueImages.slice(0, 30).length,
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
