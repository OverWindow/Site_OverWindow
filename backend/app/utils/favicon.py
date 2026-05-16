import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin


TIMEOUT = 5
MAX_HTML_BYTES = 512 * 1024
HEADERS = {
    "User-Agent": "overwindow-backend/1.0",
}


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
        with requests.get(
            favicon_url,
            headers=HEADERS,
            timeout=TIMEOUT,
            stream=True,
        ) as response:
            if is_valid_image(response):
                return favicon_url
    except Exception:
        pass

    return None


def try_html_favicon(url: str):
    try:
        with requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True) as response:
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if content_type and "html" not in content_type.lower():
                return None

            chunks = []
            total = 0
            for chunk in response.iter_content(chunk_size=16384):
                if not chunk:
                    continue
                total += len(chunk)
                if total > MAX_HTML_BYTES:
                    chunks.append(chunk[: MAX_HTML_BYTES - (total - len(chunk))])
                    break
                chunks.append(chunk)

            html = b"".join(chunks).decode(response.encoding or "utf-8", errors="ignore")

        soup = BeautifulSoup(html, "html.parser")

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
