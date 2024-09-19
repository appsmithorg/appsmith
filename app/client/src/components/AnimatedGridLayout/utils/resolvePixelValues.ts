import { normalizeMeasurement } from "./normalizeMeasurement";

/**
 * Resolves the pixel values for grid fr measurements. Assumes that gap is always 0.
 */
export function resolvePixelValues(totalPixels: number, sizes: string[]) {
  let frCount = 0;
  let pxCount = 0;

  for (const size of sizes) {
    if (size.includes("fr")) {
      frCount += normalizeMeasurement(size);
    } else {
      pxCount += normalizeMeasurement(size);
    }
  }

  const frInPixels = (totalPixels - pxCount) / frCount;

  return sizes.map((size) => {
    if (size.includes("fr")) {
      return normalizeMeasurement(size) * frInPixels;
    }

    return normalizeMeasurement(size);
  });
}
