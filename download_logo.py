import urllib.request
import base64

url = "https://www.pimms.com/wp-content/uploads/2020/04/pimms-1.png"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    img_data = response.read()
    b64 = base64.b64encode(img_data).decode('utf-8')
    with open('js/logo.js', 'w') as f:
        f.write(f'const PIMMS_LOGO_B64 = "data:image/png;base64,{b64}";\n')
