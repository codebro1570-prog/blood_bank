import urllib.request
import urllib.error
import json

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=5) as r:
        return r.status, r.read().decode('utf-8')

targets = [
    ('Admin / Staff Portal', 'http://localhost:5173/'),
    ('Donor Portal', 'http://localhost:5174/'),
    ('Hospital Portal', 'http://localhost:5175/'),
    ('Swagger UI Docs', 'http://localhost:8080/swagger-ui.html'),
    ('OpenAPI JSON Spec', 'http://localhost:8080/v3/api-docs')
]

for name, url in targets:
    try:
        status, content = fetch(url)
        print(f"PASS: {name} ({url}) -> HTTP {status} (Length: {len(content)} bytes)")
    except Exception as e:
        print(f"FAIL: {name} ({url}) -> {e}")
