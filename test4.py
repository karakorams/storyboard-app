import urllib.request
import httpx
from google import genai

client = genai.Client(api_key="AIzaSyA_XXXXXXXXXXXXXXXXXXXXX_XXXXXXX")

proxy_client = httpx.Client(proxy="http://localhost:8888")
client._http_client = proxy_client

try:
    result = client.models.generate_images(
        model='imagen-3.0-generate-002',
        prompt='Fuzzy bunnies in my kitchen',
        config=genai.types.GenerateImagesConfig(
            number_of_images=1
        )
    )
    print(result)
except Exception as e:
    print(type(e), e)
