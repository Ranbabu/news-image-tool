export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/search') {
      const query = url.searchParams.get("q");
      if (!query) {
        return new Response(JSON.stringify({ error: "हेडलाइन नहीं मिली" }), { headers: { "Content-Type": "application/json" } });
      }

      try {
        const qwantUrl = `https://api.qwant.com/v3/search/images?q=${encodeURIComponent(query)}&count=15&locale=en_US`;
        const response = await fetch(qwantUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        const data = await response.json();
        
        let images = [];
        if (data && data.data && data.data.result && data.data.result.items) {
            images = data.data.result.items.map(item => ({ image: item.media }));
        }
        return new Response(JSON.stringify(images), { headers: { "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({ error: "API Error" }), { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
