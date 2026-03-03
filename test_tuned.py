import json
import urllib.request

with open('key.env', 'r') as f:
    k = f.read().strip()

url = f"https://generativelanguage.googleapis.com/v1beta/tunedModels?key={k}"
try:
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
