export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS Headers: यह GitHub Pages को API से कनेक्ट करने की अनुमति देता है
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // OPTIONS रिक्वेस्ट (CORS प्रीफ्लाइट) को हैंडल करना
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/search') {
      const query = url.searchParams.get("q");
      if (!query) {
        return new Response(JSON.stringify({ error: "हेडलाइन नहीं मिली" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
        });
      }

      try {
        // Qwant API URL (locale hi_IN कर दिया है)
        const qwantUrl = `https://api.qwant.com/v3/search/images?q=${encodeURIComponent(query)}&count=20&locale=hi_IN`;
        
        const response = await fetch(qwantUrl, {
          headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "application/json"
          }
        });

        const data = await response.json();
        
        let images = [];
        if (data && data.data && data.data.result && data.data.result.items) {
            images = data.data.result.items.map(item => ({ image: item.media }));
        }
        
        return new Response(JSON.stringify(images), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "API Error" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
        });
      }
    }

    // अगर आप Cloudflare Pages इस्तेमाल कर रहे हैं
    if (env.ASSETS) {
        return env.ASSETS.fetch(request);
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
