import { CanvasTexture, ClampToEdgeWrapping } from "three";

let cached: CanvasTexture | null = null;

/**
 * Value noise: hash function returning pseudo-random 0..1 for integer coords.
 */
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263 + 1274126177;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

/**
 * Smooth noise via bilinear interpolation of hash values.
 */
function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);
  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
}

/**
 * Fractal Brownian Motion — sums octaves of noise for natural terrain.
 */
function fbm(x: number, y: number, octaves: number, lacunarity: number, gain: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    maxValue += amplitude;
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return value / maxValue;
}

/**
 * Terrain color ramp: elevation → color
 * Low (water/plains) → green-tan → mid (hills) → brown → high (mountains) → grey-white
 */
function terrainColor(t: number): [number, number, number] {
  // Clamp
  t = Math.max(0, Math.min(1, t));
  if (t < 0.15) {
    // Deep green lowlands
    const s = t / 0.15;
    return [140 + s * 40, 160 + s * 30, 100 + s * 40];
  } else if (t < 0.35) {
    // Light green / tan transition
    const s = (t - 0.15) / 0.2;
    return [180 + s * 30, 190 + s * 10, 140 - s * 20];
  } else if (t < 0.55) {
    // Tan / light brown hills
    const s = (t - 0.35) / 0.2;
    return [210 - s * 30, 200 - s * 35, 120 - s * 10];
  } else if (t < 0.75) {
    // Brown mountains
    const s = (t - 0.55) / 0.2;
    return [180 - s * 20, 165 - s * 25, 110 - s * 15];
  } else if (t < 0.9) {
    // Dark grey / rocky
    const s = (t - 0.75) / 0.15;
    return [160 - s * 20, 140 - s * 20, 95 - s * 15];
  } else {
    // White peaks
    const s = (t - 0.9) / 0.1;
    return [140 + s * 100, 120 + s * 115, 80 + s * 155];
  }
}

export function getTerrainTexture(): CanvasTexture | null {
  if (cached) return cached;

  try {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        // Normalized coords with slight offset for more natural look
        const nx = px / size * 8;
        const ny = py / size * 8;

        // FBM with 6 octaves for rich terrain detail
        const elevation = fbm(nx, ny, 6, 2.0, 0.5);

        // Add micro-detail
        const micro = smoothNoise(nx * 3, ny * 3) * 0.05;

        const [r, g, b] = terrainColor(elevation + micro);

        const idx = (py * size + px) * 4;
        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    cached = new CanvasTexture(canvas);
    cached.wrapS = ClampToEdgeWrapping;
    cached.wrapT = ClampToEdgeWrapping;
    cached.colorSpace = "srgb" as any;
    cached.needsUpdate = true;
    return cached;
  } catch (e) {
    console.warn("Terrain texture generation failed:", e);
    return null;
  }
}
