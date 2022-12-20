import { ellipsis } from "./ellipsis";

describe("audit-logs/utils/ellipsis", () => {
  it("returns string with ellipsis at the end", () => {
    const input = "returns string with ellipsis at the end";
    const actual = ellipsis(input);
    const expected = "returns string with e...";
    expect(actual).toEqual(expected);
  });
  it("returns empty string without ellipsis if input is empty string", () => {
    const input = "";
    const actual = ellipsis(input);
    const expected = "";
    expect(actual).toEqual(expected);
  });
});
