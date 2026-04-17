const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// सुरक्षा के लिए: IPs को ट्रैक करने का सिस्टम (5 सेकंड का कूलडाउन)
const requestIPs = new Map();

const rateLimiter = (req, res, next) => {
    // यूज़र का IP एड्रेस निकालना
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const cooldownTime = 5000; // 5000 मिलीसेकंड = 5 सेकंड

    if (requestIPs.has(ip)) {
        const lastRequestTime = requestIPs.get(ip);
        if (now - lastRequestTime < cooldownTime) {
            return res.status(429).json({ error: 'आपने बहुत जल्दी रिक्वेस्ट की है। कृपया 5 सेकंड रुककर दोबारा सर्च करें।' });
        }
    }
    
    // IP और समय को सेव करना
    requestIPs.set(ip, now);
    next();
};

// मुख्य पेज के लिए रूट
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// इमेज सर्च के लिए मुख्य API रूट (इसमें rateLimiter जोड़ दिया गया है)
app.get('/api/search', rateLimiter, async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ error: 'कृपया सर्च कीवर्ड (q) डालें' });
  }

  try {
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2`;
    
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    });

    const html = await response.text();

    const imgRegex = /https:\/\/tse[0-9]\.mm\.bing\.net\/th\?id=[^&"'\s]+/g;
    let match;
    let images = [];

    while ((match = imgRegex.exec(html)) !== null) {
        images.push(match[0]);
    }

    const uniqueImages = [...new Set(images)].map(url => ({ image: url, url: url }));

    if (uniqueImages.length === 0) {
       return res.json({ error: "इस हेडलाइन से जुड़ी कोई इमेज नहीं मिली। कोई दूसरा कीवर्ड ट्राई करें।" });
    }

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

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
