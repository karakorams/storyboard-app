import logging
import httpx
from google import genai

logging.basicConfig(level=logging.DEBUG)

client = genai.Client(api_key="AIzaSyA_XXXXXXXXXXXXXXXXXXXXX_XXXXXXX")

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
