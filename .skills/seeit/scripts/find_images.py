#!/usr/bin/env python3
"""Search Wikimedia Commons for images of a person/place/thing and download 1-N thumbnails.

Wikimedia Commons is the primary source because:
  - All files carry free-license metadata (Public Domain, CC-BY, CC-BY-SA, etc.)
  - commons.wikimedia.org and upload.wikimedia.org are reachable from the local network
  - *.wikipedia.org is DNS-polluted / blocked and must not be used

Usage:
  python3 find_images.py "Albert Einstein"
  python3 find_images.py "保时捷911" -n 1 -o ~/Pictures/seeit
"""

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

import requests

USER_AGENT = "seeit-skill/1.0 (personal image-lookup tool; opencode skill)"
HEADERS = {"User-Agent": USER_AGENT}
TIMEOUT = 30
THUMB_WIDTH = 1280

ACCEPTED_MIMES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/tiff",
    "image/svg+xml",
}

COMMONS_API = "https://commons.wikimedia.org/w/api.php"

PREFERRED_LICENSES = {
    "public domain": 0,
    "pd": 0,
    "cc0": 0,
    "cc by 1.0": 1,
    "cc by 2.0": 1,
    "cc by 3.0": 1,
    "cc by 4.0": 1,
    "cc-by": 1,
    "cc by-sa 1.0": 2,
    "cc by-sa 2.0": 2,
    "cc by-sa 3.0": 2,
    "cc by-sa 4.0": 2,
    "cc-by-sa": 2,
    "gfdl": 3,
    "cc by-nc": 4,
    "cc by-nc-sa": 4,
}


def strip_html(text):
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def sanitize(name):
    cleaned = re.sub(r"[^\w\-.]+", "_", name).strip("_")
    return cleaned[:60] or "image"


def license_priority(license_str):
    key = license_str.lower().strip()
    if key in PREFERRED_LICENSES:
        return PREFERRED_LICENSES[key]
    for fragment, prio in PREFERRED_LICENSES.items():
        if fragment in key:
            return prio
    return 5


def title_match_score(term, file_title):
    title_base = re.sub(r"^(file|image):\s*", "", file_title, flags=re.IGNORECASE)
    title_base = re.sub(r"\.[a-z]{2,4}$", "", title_base, flags=re.IGNORECASE)
    title_lower = title_base.lower()
    words = re.findall(r"[\w]+", term.lower())
    words = [w for w in words if len(w) > 1]
    if not words:
        return 0
    hits = sum(1 for w in words if w in title_lower)
    ratio = hits / len(words)
    if ratio >= 1.0:
        return 0
    if ratio >= 0.5:
        return 1
    return 2


def search_commons(term, limit=8):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": term,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime|size",
        "iiurlwidth": THUMB_WIDTH,
        "format": "json",
    }
    r = requests.get(COMMONS_API, params=params, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    pages = data.get("query", {}).get("pages", {})
    results = []
    for page in pages.values():
        ii_list = page.get("imageinfo")
        if not ii_list:
            continue
        ii = ii_list[0]
        mime = ii.get("mime", "")
        if mime not in ACCEPTED_MIMES:
            continue
        thumb_url = ii.get("thumburl") or ii.get("url")
        if not thumb_url:
            continue
        meta = ii.get("extmetadata", {})
        license_short = strip_html(
            meta.get("LicenseShortName", {}).get("value", "Unknown")
        )
        artist = strip_html(meta.get("Artist", {}).get("value", ""))
        credit = strip_html(meta.get("Credit", {}).get("value", ""))
        desc = strip_html(meta.get("ImageDescription", {}).get("value", ""))
        title = page.get("title", "")
        results.append(
            {
                "title": title,
                "mime": mime,
                "width": ii.get("width"),
                "height": ii.get("height"),
                "thumb_url": thumb_url,
                "original_url": ii.get("url", ""),
                "page_url": ii.get("descriptionurl", ""),
                "license": license_short,
                "author": artist[:200],
                "credit": credit[:200],
                "description": desc[:300],
                "_title_match": title_match_score(term, title),
                "_prio": license_priority(license_short),
                "_index": page.get("index", 99),
            }
        )
    results.sort(key=lambda x: (x["_title_match"], x["_prio"], x["_index"]))
    return results


def download_image(url, dest, retries=2):
    dest.parent.mkdir(parents=True, exist_ok=True)
    last_err = None
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True)
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            return dest.stat().st_size
        except (requests.RequestException, OSError) as e:
            last_err = e
            if attempt < retries:
                time.sleep(1)
            continue
    raise last_err


def guess_extension(url, mime):
    mime_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/tiff": ".tif",
        "image/svg+xml": ".svg",
    }
    if mime in mime_map:
        return mime_map[mime]
    path = urllib.parse.urlparse(url).path
    if "." in Path(path).name:
        return Path(path).suffix[:5]
    return ".jpg"


def open_files(paths):
    if not paths:
        return
    try:
        subprocess.run(["open"] + paths, check=False, timeout=10)
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(
        description="Find and download images of a person, place, or thing from Wikimedia Commons."
    )
    parser.add_argument("term", help="Name or noun to look up, e.g. 'Albert Einstein' or '兵马俑'")
    parser.add_argument(
        "-o", "--output", default="/tmp/seeit", help="Output directory (default: /tmp/seeit)"
    )
    parser.add_argument(
        "-n", "--count", type=int, default=2, help="Number of images to download (default: 2)"
    )
    parser.add_argument("--no-open", action="store_true", help="Don't auto-open images after download")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show extra detail")
    args = parser.parse_args()

    term = args.term.strip()
    if not term:
        parser.error("term is required")

    out_dir = Path(args.output).expanduser()
    sub_dir = out_dir / sanitize(term)

    print(f"Searching Wikimedia Commons for: {term}")
    candidates = []
    try:
        candidates = search_commons(term, limit=max(args.count * 4, 8))
    except requests.RequestException as e:
        print(f"ERROR: Commons search failed: {e}", file=sys.stderr)
        sys.exit(1)

    if not candidates and " " not in term:
        try:
            candidates = search_commons(f'"{term}"', limit=max(args.count * 4, 8))
        except requests.RequestException:
            pass

    if not candidates:
        print(f"No images found for '{term}'.", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Found {len(candidates)} candidate(s):")
        for c in candidates:
            print(f"  [{c['license'][:20]:20s}] {c['title']}")
        print()

    downloaded = []
    seen_urls = set()
    for cand in candidates:
        if len(downloaded) >= args.count:
            break
        thumb = cand["thumb_url"]
        if thumb in seen_urls:
            continue
        ext = guess_extension(thumb, cand["mime"])
        fname = f"{sanitize(term)}_{len(downloaded) + 1}{ext}"
        dest = sub_dir / fname
        t0 = time.time()
        try:
            size = download_image(thumb, dest)
            elapsed = time.time() - t0
            seen_urls.add(thumb)
            cand["file"] = str(dest)
            cand["bytes"] = size
            downloaded.append(cand)
            size_kb = size / 1024
            print(f"  [ok] {dest}  ({size_kb:.0f} KB, {elapsed:.1f}s)")
        except requests.RequestException as e:
            print(f"  [skip] {cand['title']}: {e}", file=sys.stderr)

    if not downloaded:
        print("ERROR: found candidates but all downloads failed.", file=sys.stderr)
        sys.exit(1)

    meta_path = sub_dir / f"{sanitize(term)}_meta.json"
    meta_data = [
        {k: v for k, v in d.items() if not k.startswith("_")} for d in downloaded
    ]
    meta_path.write_text(
        json.dumps(meta_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\n--- {len(downloaded)} image(s) for '{term}' ---")
    for d in downloaded:
        print(f"  {d['file']}")
        print(f"    Title  : {d['title']}")
        print(f"    License: {d['license']}")
        if d.get("author"):
            print(f"    Author : {d['author'][:100]}")
        print(f"    Source : {d['page_url']}")

    if not args.no_open:
        open_files([d["file"] for d in downloaded])


if __name__ == "__main__":
    main()
