export default {
  async fetch(request) {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ error: "No query" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // DuckDuckGo Search Fetching
    const ddgUrl = `https://duckduckgo.com/pd/?q=${encodeURIComponent(query)}&kl=wt-wt`;
    const response = await fetch(ddgUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data.results), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
