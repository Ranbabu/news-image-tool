const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// सुरक्षा के लिए: IP Tracking (5 सेकंड का टाइमर)
const requestIPs = new Map();

const rateLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const cooldownTime = 5000;

    if (requestIPs.has(ip)) {
        if (now - requestIPs.get(ip) < cooldownTime) {
            return res.status(429).json({ error: 'आपने बहुत जल्दी रिक्वेस्ट की है। कृपया 5 सेकंड रुकें।' });
        }
    }
    
    requestIPs.set(ip, now);
    next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🧠 स्मार्ट फ़िल्टर: हेडलाइन से फालतू शब्द और निशान हटाने का फंक्शन
function smartKeywordExtractor(text) {
    // कॉमा, फुलस्टॉप और अन्य निशानों को हटाना
    let cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()।]/g," ");
    
    // हिंदी के वो शब्द जो सर्च को खराब करते हैं (Stop words)
    const stopWords = ['में', 'है', 'के', 'की', 'और', 'या', 'का', 'को', 'से', 'पर', 'ने', 'लिए', 'तथा', 'एक', 'इस', 'कि', 'वह', 'यह', 'तो', 'भी', 'वाले', 'वाली'];
    
    let words = cleanText.split(/\s+/);
    
    // सिर्फ मेन कीवर्ड्स को बचाना
    let keywords = words.filter(word => word.trim().length > 1 && !stopWords.includes(word.trim()));
    
    return keywords.join(" ").trim();
}

// 🌐 Bing से इमेज निकालने का मुख्य फंक्शन
async function getBingImages(searchQuery) {
    try {
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&form=HDRSC2`;
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

        return [...new Set(images)].map(url => ({ image: url, url: url }));
    } catch (e) {
        console.error("Bing Fetch Error:", e);
        return [];
    }
}

// इमेज सर्च के लिए API रूट
app.get('/api/search', rateLimiter, async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ error: 'कृपया सर्च कीवर्ड (q) डालें' });
  }

  try {
    // Step 1: सबसे पहले जो यूजर ने डाला है, उसी पूरी लाइन से सर्च करें
    let uniqueImages = await getBingImages(q);

    // Step 2: अगर पूरी लाइन से कोई इमेज नहीं मिली, तो "स्मार्ट फ़िल्टर" चालू करें
    if (uniqueImages.length === 0) {
        const smartQuery = smartKeywordExtractor(q); // फालतू शब्द हटाए
        
        // अगर स्मार्ट कीवर्ड मूल शब्द से अलग है, तो दोबारा सर्च करें
        if (smartQuery && smartQuery !== q) {
            uniqueImages = await getBingImages(smartQuery);
        }
    }

    // Step 3: अगर अभी भी कुछ नहीं मिला
    if (uniqueImages.length === 0) {
       return res.json({ error: "इस हेडलाइन से जुड़ी कोई इमेज नहीं मिली। कृपया कोई छोटा कीवर्ड ट्राई करें।" });
    }

    // रिस्पॉन्स भेजना
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
