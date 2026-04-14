export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // अगर कोई इमेज सर्च कर रहा है, तो API चलाएं
    if (url.pathname === '/search') {
      const query = url.searchParams.get("q");
      if (!query) {
        return new Response(JSON.stringify({ error: "हेडलाइन नहीं मिली" }), { headers: { "Content-Type": "application/json" } });
      }

      try {
        const ddgUrl = `https://duckduckgo.com/pd/?q=${encodeURIComponent(query)}&kl=wt-wt`;
        const response = await fetch(ddgUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        const data = await response.json();
        return new Response(JSON.stringify(data.results), { 
          headers: { "Content-Type": "application/json" } 
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "API Error" }), { status: 500 });
      }
    }

    // बाकी सभी चीज़ों के लिए आपकी index.html वेबसाइट दिखाएं
    return env.ASSETS.fetch(request);
  }
};
