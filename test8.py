import httpx
from google import genai
import inspect

def log_request(request):
    print("URL:", request.url)
    print("BODY:", request.read().decode('utf-8'))

client = genai.Client(api_key="AIzaSyA_XXXXXXXXXXXXXXXXXXXXX_XXXXXXX")
proxy_client = httpx.Client(event_hooks={'request': [log_request]})
client._http_client = proxy_client

try:
    result = client.models.generate_images(
        model='imagen-3.0-generate-001',
        prompt='Fuzzy bunnies in my kitchen',
        config=genai.types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="1:1"
        )
    )
except Exception as e:
    pass
