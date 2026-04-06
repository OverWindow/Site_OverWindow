import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin


TIMEOUT = 5


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    return url


def get_default_favicon(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/favicon.ico"


def is_valid_image(resp: requests.Response) -> bool:
    content_type = resp.headers.get("content-type", "")
    return resp.status_code == 200 and "image" in content_type


def try_default_favicon(url: str):
    favicon_url = get_default_favicon(url)

    try:
        r = requests.get(favicon_url, timeout=TIMEOUT)
        if is_valid_image(r):
            return favicon_url
    except Exception:
        pass

    return None


def try_html_favicon(url: str):
    try:
        r = requests.get(url, timeout=TIMEOUT)
        soup = BeautifulSoup(r.text, "html.parser")

        for link in soup.find_all("link"):
            rel = link.get("rel", [])
            href = link.get("href")

            if not href:
                continue

            rel_text = " ".join(rel).lower()

            if "icon" in rel_text:
                return urljoin(url, href)

    except Exception:
        pass

    return None


def extract_favicon_url(url: str):
    url = normalize_url(url)

    # 1차 시도
    favicon = try_default_favicon(url)
    if favicon:
        return favicon

    # 2차 시도
    favicon = try_html_favicon(url)
    if favicon:
        return favicon

    return None