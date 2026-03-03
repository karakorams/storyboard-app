import urllib.request
import re

try:
    req = urllib.request.Request("https://discuss.ai.google.dev/t/imagen-model-not-found-in-python-google-generative-ai/46547", headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    text = re.sub(r'<[^>]+>', ' ', html)
    import textwrap
    text_short = textwrap.shorten(text, width=4000)
    print(text_short.encode('ascii', errors='replace').decode('ascii'))
except Exception as e:
    print(e)
