import { splitJoin } from "./splitJoin";

describe("audit-logs/utils/splitJoin", () => {
  it("returns correct value on default input", () => {
    const input = "a_b_c";
    const actual = splitJoin(input);
    const expected = "a b c";
    expect(actual).toEqual(expected);
  });
  it("returns correct value for non default input", () => {
    const input = "a.b_c";
    const actual = splitJoin(input, ".");
    const expected = "a b_c";
    expect(actual).toEqual(expected);
  });
  it("returns correct value for non default input on multiple splitJoin", () => {
    const input = "a-b.c";
    const actual = splitJoin(splitJoin(input, "-", "."), ".", ",");
    const expected = "a,b,c";
    expect(actual).toEqual(expected);
  });
  it("returns empty string when input is empty string", () => {
    const input = "";
    const actual = splitJoin(input);
    const expected = "";
    expect(actual).toEqual(expected);
  });
});
