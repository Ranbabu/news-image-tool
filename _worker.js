export default {
  async fetch(request) {
    // CORS Preflight Request को हैंडल करना
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ error: "No query" }), {
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      });
    }

    try {
        const ddgUrl = `https://duckduckgo.com/pd/?q=${encodeURIComponent(query)}&kl=wt-wt`;
        const response = await fetch(ddgUrl);
        const data = await response.json();

        return new Response(JSON.stringify(data.results), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch images" }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
    }
  }
};
