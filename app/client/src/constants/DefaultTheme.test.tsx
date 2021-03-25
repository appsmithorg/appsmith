import { getBorderCSSShorthand } from "constants/DefaultTheme";

describe("test getBorderCSSShorthand", () => {
  it("test for expected value", () => {
    expect(
      getBorderCSSShorthand({
        thickness: 2,
        style: "solid",
        color: "#E0E0E0",
      }),
    ).toEqual("2px solid #E0E0E0");
  });
  it("test for empty value", () => {
    expect(getBorderCSSShorthand(undefined)).toEqual("");
  });
});
