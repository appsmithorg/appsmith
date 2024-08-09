import { resolvePixelValues } from "./resolvePixelValues";

describe("resolvePixelValues", () => {
  it("should return correct pixel values for simple fr sizes", () => {
    const totalPixels = 1000;
    const sizes = ["1fr", "2fr", "1fr"];
    const result = resolvePixelValues(totalPixels, sizes);
    expect(result).toEqual([250, 500, 250]);
  });

  it("should handle sizes with mixed units", () => {
    const totalPixels = 1200;
    const sizes = ["1fr", "200px", "2fr"];
    const result = resolvePixelValues(totalPixels, sizes);
    expect(result).toEqual([333.3333333333333, 200, 666.6666666666666]);
  });

  it("should return an empty array for empty sizes", () => {
    const totalPixels = 1000;
    const sizes: string[] = [];
    const result = resolvePixelValues(totalPixels, sizes);
    expect(result).toEqual([]);
  });

  it("should handle invalid sizes gracefully", () => {
    const totalPixels = 1000;
    const sizes = ["1fr", "invalid", "2fr"];
    const result = resolvePixelValues(totalPixels, sizes);
    // Assuming the function returns NaN for invalid entries
    expect(result).toEqual([333.3333333333333, 0, 666.6666666666666]);
  });
});
