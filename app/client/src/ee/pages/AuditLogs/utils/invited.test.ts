import { invited } from "./invited";

describe("audit-logs/utils/invited", function () {
  it("returns empty string when length is negative", () => {
    const input = { length: -1 };
    const actual = invited(input as unknown as Array<string>);
    const expected = `(No one was invited.)`;
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is 0", () => {
    const input: string[] = [];
    const actual = invited(input);
    const expected = `(No one was invited.)`;
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is 1", () => {
    const input: string[] = ["user@example.com"];
    const actual = invited(input);
    const expected = "user@example.com";
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is 2 (a sub case)", () => {
    const input: string[] = ["user@example.com", "other_user@example.com"];
    const actual = invited(input);
    const expected = "user@example.com and 1 more user";
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is more than 2 (a sub case)", () => {
    const input: string[] = [
      "user@example.com",
      "other_user@example.com",
      "yet_another@example.com",
    ];
    const actual = invited(input);
    const expected = "user@example.com and 2 more users";
    expect(actual).toEqual(expected);
  });
});
