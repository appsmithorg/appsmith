import { COLOR_REGEX } from "./constants";

describe("validate RegEx for color", () => {
  it("should validate all hex values", () => {
    const inputs = [
      "#fff",
      "#ffff",
      "#f00",
      "#ff0000",
      "#ff000000",
      "fff",
      "#f0000",
    ];
    const expected = [true, true, true, true, true, false, false];

    inputs.forEach((input, index) => {
      const result = COLOR_REGEX.test(input);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("should validate all rgb / rgba values", () => {
    const inputs = [
      "rgb(255, 0, 0)",
      "rgb(255,0,0)",
      "rgb (255,0,0)",
      "rgb( 255,0,0 )",
      "rgb( 255 , 0, 0 )",
      "rgba(255, 0, 0, 0.5)",
      "rgba(255,0,0, 1)",
      "rgba (255,0,0, 0.5)",
      "rgba( 255,0,0, 0.5 )",
      "rgba( 255 , 0, 0, 1 )",
    ];
    const expected = [
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      false,
      true,
      true,
    ];

    inputs.forEach((input, index) => {
      const result = COLOR_REGEX.test(input);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});
