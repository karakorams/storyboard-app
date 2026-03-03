import urllib.request
import json

try:
    req = urllib.request.Request("https://html.duckduckgo.com/html/?q=site:ai.google.dev+%22google-genai%22+imagen+3", headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req)
    html = resp.read().decode('utf-8')
    # simple extract text
    import re
    text = re.sub(r'<[^>]+>', ' ', html)
    print("Found 'imagen-3' matches:", re.findall(r'.{0,40}imagen-3.{0,40}', text, re.IGNORECASE))
except Exception as e:
    print(e)
