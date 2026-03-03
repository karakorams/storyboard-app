import logging
import httpx
from google import genai
import httpx
import logging

logging.basicConfig(level=logging.DEBUG)
client = genai.Client(api_key="AIzaSyA_XXXXXXXXXXXXXXXXXXXXX_XXXXXXX")

def log_request(request):
    print(f"Request event hook: {request.method} {request.url} - Waiting for response")
    print("Body:", request.read())
def log_response(response):
    print(f"Response event hook: {response.request.method} {response.request.url} - Status {response.status_code}")

proxy_client = httpx.Client(event_hooks={'request': [log_request], 'response': [log_response]})
client._http_client = proxy_client

try:
    result = client.models.generate_images(
        model='imagen-3.0-generate-001',
        prompt='Fuzzy bunnies in my kitchen',
        config=genai.types.GenerateImagesConfig(
            number_of_images=1
        )
    )
except Exception as e:
    pass
