"""Fetch named OpenStreetMap routes tagged 4wd_only and write src/data/fourwd.ts."""
import json
import math
import re
import time
import urllib.request
from pathlib import Path

URL = "https://overpass.openstreetmap.fr/api/interpreter"
ROOT = Path("/workspace")

# (south, west, north, east)
BOXES = [
    ("vegas", 35.0, -116.2, 37.2, -114.04),
    ("utah1", 37.0, -114.15, 38.3, -109.04),
    ("utah2", 38.3, -114.15, 39.6, -109.04),
    ("utah3", 39.6, -114.15, 42.05, -109.04),
    ("az1", 31.3, -114.9, 33.4, -109.04),
    ("az2", 33.4, -114.9, 35.2, -109.04),
    ("az3", 35.2, -114.9, 37.05, -109.04),
    ("co1", 36.95, -109.15, 38.2, -105.5),
    ("co2", 36.95, -105.5, 38.2, -104.3),
    ("co3", 38.2, -109.15, 39.6, -106.2),
    ("co4", 38.2, -106.2, 39.6, -104.3),
    ("co5", 39.6, -109.15, 41.05, -106.0),
    ("co6", 39.6, -106.0, 41.05, -104.3),
    ("nm1", 31.3, -109.1, 33.4, -105.5),
    ("nm2", 31.3, -105.5, 33.4, -103.0),
    ("nm3", 33.4, -109.1, 35.2, -105.5),
    ("nm4", 33.4, -105.5, 35.2, -103.0),
    ("nm5", 35.2, -109.1, 37.05, -105.2),
    ("nm6", 35.2, -105.2, 37.05, -103.0),
]


def overpass(query: str):
    last = "unknown"
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                URL, data=query.encode(), headers={"User-Agent": "HighDesertAtlas/1.0"}
            )
            with urllib.request.urlopen(req, timeout=100) as response:
                return json.load(response)
        except Exception as error:  # noqa: BLE001
            last = f"{type(error).__name__}: {error}"
            print("  retry", attempt, last)
            time.sleep(2 + attempt * 2)
    raise RuntimeError(last)


def region_of(lat: float, lng: float) -> str:
    if lng <= -114.04 and lat <= 37.25:
        return "vegas"
    if lat >= 37.0 and lng < -109.045:
        return "utah"
    if lat < 37.0 and lng < -109.045:
        return "arizona"
    if lat >= 37.0:
        return "colorado"
    return "newmexico"


def usable(tags: dict) -> bool:
    highway = tags.get("highway")
    if not highway:
        return False
    if highway in {"footway", "cycleway", "steps", "corridor", "platform", "path"}:
        # A path tagged 4wd_only is still a motor route in this dataset.
        if highway == "path" and tags.get("4wd_only") in {"yes", "required"}:
            return True
        if highway != "path":
            return False
    return True


def dist(a, b) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def stitch(lines):
    unused = [line[:] for line in lines if len(line) >= 2]
    out = []
    tol = 0.0009
    while unused:
        chain = unused.pop()
        grew = True
        while grew:
            grew = False
            for i, seg in enumerate(unused):
                a, b = chain[0], chain[-1]
                s, e = seg[0], seg[-1]
                if dist(b, s) < tol:
                    chain = chain + seg[1:]
                elif dist(b, e) < tol:
                    chain = chain + seg[-2::-1]
                elif dist(a, e) < tol:
                    chain = seg + chain[1:]
                elif dist(a, s) < tol:
                    chain = seg[::-1] + chain[1:]
                else:
                    continue
                unused.pop(i)
                grew = True
                break
        out.append(chain)
    out.sort(key=len, reverse=True)
    return out


def simplify(points, epsilon):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        x1, y1 = points[start]
        x2, y2 = points[end]
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy) or 1
        max_d = 0
        index = -1
        for i in range(start + 1, end):
            x, y = points[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length
            if d > max_d:
                max_d = d
                index = i
        if max_d > epsilon and index != -1:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [p for p, k in zip(points, keep) if k]


def simplify_lines(lines):
    result = []
    for line in lines:
        nxt = simplify(line, 0.00035)
        if len(nxt) > 90:
            nxt = simplify(line, 0.0008)
        if len(nxt) > 120:
            nxt = simplify(line, 0.0016)
        rounded = [[round(lng, 5), round(lat, 5)] for lng, lat in nxt]
        if len(rounded) >= 2:
            result.append(rounded)
    return result


def haversine(a, b):
    radius = 3958.8
    dlat = math.radians(b[1] - a[1])
    dlng = math.radians(b[0] - a[0])
    lat1 = math.radians(a[1])
    lat2 = math.radians(b[1])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * radius * math.asin(min(1, math.sqrt(h)))


def miles_of(lines) -> float:
    total = 0.0
    for line in lines:
        for i in range(1, len(line)):
            total += haversine(line[i - 1], line[i])
    return total


def anchor(lines):
    best = lines[0]
    best_len = -1
    for line in lines:
        length = miles_of([line])
        if length > best_len:
            best = line
            best_len = length
    return best[len(best) // 2]


def norm(name: str) -> str:
    name = name.lower()
    name = name.replace("&", " and ")
    name = re.sub(r"4x4|4wd|jeep safari route|safari route", " ", name)
    name = re.sub(r"\b(road|trail|route|loop|highway)\b", " ", name)
    name = re.sub(r"[^a-z0-9]+", " ", name)
    return re.sub(r"\s+", " ", name).strip()


def slug(name: str) -> str:
    slug_text = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug_text[:48].strip("-")


def load_existing():
    text = (ROOT / "src/data/offroad.ts").read_text()
    # name fields only, paired loosely with region by walking objects is unnecessary:
    # the node list is injected below.
    return json.loads(Path("/tmp/trails/existing-names.json").read_text())


def main():
    groups: dict[tuple[str, str], list] = {}
    for label, s, w, n, e in BOXES:
        print(f"fetch {label}")
        query = f"""[out:json][timeout:80];
(
  way["4wd_only"="yes"]["name"]({s},{w},{n},{e});
  way["4wd_only"="required"]["name"]({s},{w},{n},{e});
);
out geom;"""
        data = overpass(query)
        ways = data.get("elements", [])
        print(f"  {len(ways)} ways")
        for way in ways:
            tags = way.get("tags") or {}
            if not usable(tags):
                continue
            geom = way.get("geometry") or []
            if len(geom) < 2:
                continue
            line = [[p["lon"], p["lat"]] for p in geom]
            mid = line[len(line) // 2]
            region = region_of(mid[1], mid[0])
            name = tags["name"].strip()
            groups.setdefault((region, name), []).append(line)
        time.sleep(0.6)

    existing = load_existing()
    places = []
    skipped_known = 0
    skipped_short = 0
    for (region, name), raw_lines in sorted(groups.items(), key=lambda item: (item[0][0], item[0][1])):
        key = norm(name)
        if not key or key in existing.get(region, []):
            skipped_known += 1
            continue
        # Also skip when an existing name contains this one or vice versa, same region.
        if any(key in have or have in key for have in existing.get(region, []) if len(have) > 4 and len(key) > 4):
            skipped_known += 1
            continue
        line = simplify_lines(stitch(raw_lines))
        miles = miles_of(line)
        if not line or miles < 0.35:
            skipped_short += 1
            continue
        lng, lat = anchor(line)
        place_id = f"4wd-{region}-{slug(name)}"
        places.append(
            [
                place_id,
                name,
                region,
                round(lat, 5),
                round(lng, 5),
                round(miles, 1),
                line,
            ]
        )

    # Unique ids
    seen = set()
    unique = []
    for place in places:
        base = place[0]
        n = 2
        while place[0] in seen:
            place[0] = f"{base}-{n}"
            n += 1
        seen.add(place[0])
        unique.append(place)

    out = ROOT / "src/data/fourwd.json"
    out.write_text(json.dumps({"rows": unique}, separators=(",", ":")))
    print(f"wrote {len(unique)} routes, skipped known {skipped_known}, short {skipped_short}, bytes {out.stat().st_size}")


if __name__ == "__main__":
    main()
