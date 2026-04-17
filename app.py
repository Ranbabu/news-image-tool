from flask import Flask, request, jsonify
from flask_cors import CORS
from duckduckgo_search import DDGS

app = Flask(__name__)
CORS(app)

@app.route('/get_image')
def get_image():
    headline = request.args.get('query')
    if not headline:
        return jsonify({"error": "कृपया कोई हेडलाइन डालें"})
    
    try:
        with DDGS() as ddgs:
            results = ddgs.images(
                keywords=headline,
                region="in-en",
                safesearch="moderate",
                max_results=3
            )
            image_urls = []
            for result in results:
                image_urls.append(result.get('image'))
            
            return jsonify({"headline": headline, "images": image_urls})
    except Exception as e:
        return jsonify({"error": str(e)})
