const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // POST डेटा पढ़ने के लिए

// सुरक्षा के लिए: IP Tracking (5 सेकंड का टाइमर)
const requestIPs = new Map();

const rateLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const cooldownTime = 5000;

    if (requestIPs.has(ip) && (now - requestIPs.get(ip) < cooldownTime)) {
        return res.status(429).json({ error: 'आपने बहुत जल्दी रिक्वेस्ट की है। कृपया 5 सेकंड रुकें।' });
    }
    requestIPs.set(ip, now);
    next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🧠 अल्ट्रा-स्मार्ट फ़िल्टर: हेडलाइन से फालतू शब्द हटाना
function smartKeywordExtractor(text) {
    let cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()।]/g," ");
    
    // मैंने इसमें न्यूज़ वाले आम शब्द (ऐलान, किया, गया, हुआ) भी जोड़ दिए हैं
    const stopWords = [
        'में', 'है', 'के', 'की', 'और', 'या', 'का', 'को', 'से', 'पर', 'ने', 'लिए', 
        'तथा', 'एक', 'इस', 'कि', 'वह', 'यह', 'तो', 'भी', 'वाले', 'वाली', 
        'ऐलान', 'किया', 'गया', 'गई', 'हुई', 'हुआ', 'रहे', 'रहा', 'Intro', 'Outro', 'सारांश', 'चैनल', 'अपील'
    ];
    
    let words = cleanText.split(/\s+/);
    let keywords = words.filter(word => word.trim().length > 1 && !stopWords.includes(word.trim()) && !stopWords.includes(word.trim().toLowerCase()));
    
    return keywords.join(" ").trim();
}

// 🌐 Bing इमेज API फंक्शन
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
        return [...new Set(images)]; // डुप्लीकेट हटाना
    } catch (e) {
        console.error("Bing Fetch Error:", e);
        return [];
    }
}

// 🚀 GET रिक्वेस्ट - सिंगल सर्च के लिए (3-Step Magic Fallback के साथ)
app.get('/api/search', rateLimiter, async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ error: 'कृपया सर्च कीवर्ड (q) डालें' });
  }

  try {
    // Step 1: सबसे पहले जो यूजर ने डाला है, उसी से सर्च करें
    let uniqueImages = await getBingImages(q);

    // Step 2: अगर कुछ नहीं मिला, तो "स्मार्ट फ़िल्टर" (फालतू शब्द हटाकर) ट्राई करें
    if (uniqueImages.length === 0) {
        let smartQuery = smartKeywordExtractor(q); 
        if (smartQuery && smartQuery !== q) {
            uniqueImages = await getBingImages(smartQuery);
        }

        // Step 3 (अंतिम उपाय): अगर फिर भी कुछ नहीं मिला, तो सिर्फ शुरू के 2-3 शब्द उठाएं (Broad Search)
        if (uniqueImages.length === 0 && smartQuery.split(' ').length > 2) {
            // "भारत नई शिक्षा नीति" को काटकर सिर्फ "भारत शिक्षा" कर देगा
            let ultraBroadQuery = smartQuery.split(' ').slice(0, 2).join(' ');
            uniqueImages = await getBingImages(ultraBroadQuery);
        }
    }

    if (uniqueImages.length === 0) {
       return res.json({ error: "इस हेडलाइन से जुड़ी कोई इमेज नहीं मिली। कृपया कोई छोटा कीवर्ड ट्राई करें।" });
    }

    res.json({
      results: uniqueImages.slice(0, 30).map(url => ({ image: url, url: url })),
      total: uniqueImages.slice(0, 30).length,
      query: q
    });

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'सर्वर एरर, कृपया थोड़ी देर बाद प्रयास करें।' });
  }
});

// 🚀 POST रिक्वेस्ट - मल्टी-लाइन टेक्स्ट (News Studio Pro) के लिए
app.post('/api/search', rateLimiter, async (req, res) => {
  const fullText = req.body.q;

  if (!fullText) {
    return res.status(400).json({ error: 'कृपया न्यूज़ की स्क्रिप्ट डालें' });
  }

  try {
    const lines = fullText.split(/[\n।]/);
    let allFinalImages = [];
    let validQueriesCount = 0;

    for (let line of lines) {
        let cleanLine = line.trim();
        
        if (cleanLine.length < 5 || cleanLine.toLowerCase().includes('intro') || cleanLine.toLowerCase().includes('outro')) {
            continue; 
        }

        if (validQueriesCount >= 6) break; 
        validQueriesCount++;

        // Step 1: Full Line
        let imagesList = await getBingImages(cleanLine);

        // Step 2: Smart Filter
        if (imagesList.length === 0) {
            let smartQuery = smartKeywordExtractor(cleanLine);
            if (smartQuery) {
                imagesList = await getBingImages(smartQuery);
            }
            
            // Step 3: Broad Search (सिर्फ शुरू के 2 शब्द)
            if (imagesList.length === 0 && smartQuery.split(' ').length > 2) {
                let ultraBroadQuery = smartQuery.split(' ').slice(0, 2).join(' ');
                imagesList = await getBingImages(ultraBroadQuery);
            }
        }

        let formattedImages = imagesList.slice(0, 12).map(url => ({ 
            image: url, 
            sourceQuery: cleanLine 
        }));

        allFinalImages = allFinalImages.concat(formattedImages);
    }

    if (allFinalImages.length === 0) {
       return res.json({ error: "इस स्क्रिप्ट से जुड़ी कोई इमेज नहीं मिली। कीवर्ड्स बदल कर देखें।" });
    }

    res.json({
      results: allFinalImages,
      total: allFinalImages.length
    });

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'सर्वर एरर, कृपया थोड़ी देर बाद प्रयास करें।' });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
