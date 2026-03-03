from google import genai

with open('key.env', 'r') as f:
    k = f.read().strip()

client = genai.Client(api_key=k)

print("Listing models:")
for m in client.models.list():
    if 'imagen' in m.name.lower():
        print(m.name, m.model_dump())
