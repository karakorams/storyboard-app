import logging
import httpx
from google import genai

logging.basicConfig(level=logging.INFO)

with open('key.env', 'r') as f:
    k = f.read().strip()

client = genai.Client(api_key=k)

try:
    result = client.models.generate_images(
        model='imagen-4.0-generate-001',
        prompt='Fuzzy bunnies in my kitchen',
        config=genai.types.GenerateImagesConfig(
            number_of_images=1
        )
    )
    print("SUCCESS:", len(result.generated_images))
except Exception as e:
    print(type(e), e)
