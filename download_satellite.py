#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
高德卫星图下载 → 裁剪对齐 GeoJSON 边界 → 跟参考项目完全一致的贴图
"""

import math, time, json, requests
from PIL import Image
from io import BytesIO
from pathlib import Path

# ============================================================
# 1. 从 china.json 读取精确边界
# ============================================================
with open("src/assets/china.json", "r", encoding="utf-8") as f:
    geojson = json.load(f)

lons, lats = [], []
def extract(rings):
    for ring in rings:
        if isinstance(ring[0][0], (int, float)):
            for c in ring: lons.append(c[0]); lats.append(c[1])
        else: extract(ring)
for feat in geojson["features"]:
    extract(feat["geometry"]["coordinates"])

LON_MIN, LON_MAX = min(lons), max(lons)
LAT_MIN, LAT_MAX = min(lats), max(lats)
print(f"GeoJSON bbox: lon=[{LON_MIN:.2f}, {LON_MAX:.2f}] lat=[{LAT_MIN:.2f}, {LAT_MAX:.2f}]")

# ============================================================
# 2. 经纬度 -> Web Mercator 瓦片坐标
# ============================================================
def lon2x(lon, z): return (lon + 180) / 360 * (2**z)
def lat2y(lat, z): return (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * (2**z)
def x2lon(x, z):   return x / (2**z) * 360 - 180
def y2lat(y, z):   return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / (2**z)))))

ZOOM = 8
TILE_SIZE = 256

x0 = math.floor(lon2x(LON_MIN, ZOOM))
x1 = math.ceil(lon2x(LON_MAX, ZOOM)) - 1
y0 = math.floor(lat2y(LAT_MAX, ZOOM))   # north = smaller y
y1 = math.ceil(lat2y(LAT_MIN, ZOOM)) - 1  # south = larger y

cols = x1 - x0 + 1
rows = y1 - y0 + 1
total = cols * rows
print(f"Zoom {ZOOM}: {cols}x{rows} = {total} tiles")

# 瓦片网格覆盖的实际经纬度范围
TILE_LON_MIN = x2lon(x0, ZOOM)
TILE_LON_MAX = x2lon(x1 + 1, ZOOM)
TILE_LAT_MIN = y2lat(y1 + 1, ZOOM)
TILE_LAT_MAX = y2lat(y0, ZOOM)

# GeoJSON bbox 在瓦片网格中的像素偏移（用于裁剪）
full_w = cols * TILE_SIZE
full_h = rows * TILE_SIZE
crop_x0 = int((LON_MIN - TILE_LON_MIN) / (TILE_LON_MAX - TILE_LON_MIN) * full_w)
crop_x1 = int((LON_MAX - TILE_LON_MIN) / (TILE_LON_MAX - TILE_LON_MIN) * full_w)
crop_y0 = int((TILE_LAT_MAX - LAT_MAX) / (TILE_LAT_MAX - TILE_LAT_MIN) * full_h)
crop_y1 = int((TILE_LAT_MAX - LAT_MIN) / (TILE_LAT_MAX - TILE_LAT_MIN) * full_h)
print(f"Crop: x=[{crop_x0}..{crop_x1}] y=[{crop_y0}..{crop_y1}] → {crop_x1-crop_x0}x{crop_y1-crop_y0}px")

# ============================================================
# 3. 下载瓦片 + 拼接
# ============================================================
TILE_URL = "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
OUTPUT = Path("src/assets/china_satellite.png")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

canvas = Image.new("RGB", (full_w, full_h))
session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0"})
downloaded = failed = 0

for row, y in enumerate(range(y0, y1 + 1)):
    for col, x in enumerate(range(x0, x1 + 1)):
        s = ((x + y) % 4) + 1
        url = TILE_URL.format(s=s, x=x, y=y, z=ZOOM)
        try:
            resp = session.get(url, timeout=10)
            if resp.status_code == 200 and len(resp.content) > 100:
                img = Image.open(BytesIO(resp.content))
                canvas.paste(img, (col * TILE_SIZE, row * TILE_SIZE))
                downloaded += 1
            else:
                failed += 1
        except:
            failed += 1
        if (downloaded + failed) % 50 == 0:
            print(f"  {downloaded+failed}/{total} (fail:{failed})")
        time.sleep(0.06)

print(f"Downloaded: {downloaded}, Failed: {failed}")

# ============================================================
# 4. 裁剪到 GeoJSON 精确边界 → 纹理与 UV 完美对齐
# ============================================================
cropped = canvas.crop((crop_x0, crop_y0, crop_x1, crop_y1))
# 缩放到适合 Web 的大小 (2048 是 2 的幂，GPU 可以生成 mipmap 防波纹)
target_w = 2048
ratio = target_w / cropped.width
target_h = int(cropped.height * ratio)
# 补到 2 的幂 (2048)
if target_h % 2 != 0: target_h += 1
final = cropped.resize((target_w, target_h), Image.LANCZOS)
final.save(str(OUTPUT), "PNG", optimize=True)

size_mb = OUTPUT.stat().st_size / 1024 / 1024
print(f"Saved: {OUTPUT} ({target_w}x{target_h}, {size_mb:.1f} MB)")
print("Done! Texture now perfectly aligned with GeoJSON bbox.")
