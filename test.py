import urllib.request
import json
import traceback

try:
    req = urllib.request.Request("https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta")
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode('utf-8'))
    
    models_methods = data.get('resources', {}).get('models', {}).get('methods', {})
    print("Available methods for models:", list(models_methods.keys()))
    
    if 'generateImages' in models_methods:
        print("Schema for generateImages:")
        print(json.dumps(models_methods['generateImages'], indent=2))
        
    if 'predict' in models_methods:
        print("Schema for predict:")
        print(json.dumps(models_methods['predict'], indent=2))
        
except Exception as e:
    print("Error:")
    traceback.print_exc()
