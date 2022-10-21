import { titleCase } from "./titleCase";

describe("audit-logs/utils/titleCase", () => {
  it(`returns "Title cased sentence"`, () => {
    const input = "am I a title cased string";
    const actual = titleCase(input);
    const expected = "Am I a title cased string";
    expect(actual).toEqual(expected);
  });
  it(`returns empty string when input is empty`, () => {
    const input = "";
    const actual = titleCase(input);
    const expected = "";
    expect(actual).toEqual(expected);
  });
});
