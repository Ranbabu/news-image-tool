export default {
  async fetch(request) {
    // CORS Headers: यह हर ब्राउज़र को कनेक्ट करने की परमिशन देता है
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight request handling
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/search') {
      const query = url.searchParams.get("q");
      
      if (!query) {
        return new Response(JSON.stringify({ error: "No query provided" }), { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      try {
        const qwantUrl = `https://api.qwant.com/v3/search/images?q=${encodeURIComponent(query)}&count=20&locale=hi_IN`;
        
        const response = await fetch(qwantUrl, {
          headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        const data = await response.json();
        
        let images = [];
        if (data && data.data && data.data.result && data.data.result.items) {
            images = data.data.result.items.map(item => ({ image: item.media }));
        }
        
        // सफल होने पर रिज़ल्ट भेजना
        return new Response(JSON.stringify(images), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
        
      } catch (error) {
        // API एरर आने पर
        return new Response(JSON.stringify({ error: "API connection failed" }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    }

    return new Response("Not Found", { 
        status: 404, 
        headers: corsHeaders 
    });
  }
};
