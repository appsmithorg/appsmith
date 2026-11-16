import { getTextFromHTML, stripHtmlTags } from "./getTextFromHTML";

describe("getTextFromHTML", () => {
  it("returns empty string for nullish values", () => {
    expect(getTextFromHTML(null)).toBe("");
    expect(getTextFromHTML(undefined)).toBe("");
    expect(getTextFromHTML("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(getTextFromHTML("completed")).toBe("completed");
  });

  it("extracts text from HTML tags", () => {
    expect(getTextFromHTML("<p>abc</p>")).toBe("abc");
    expect(
      getTextFromHTML(
        '<span style="display:inline-block; color:white">completed</span>',
      ),
    ).toBe("completed");
  });

  it("inserts spaces between adjacent tagged text like the worker path", () => {
    expect(getTextFromHTML("Line1<br>Line2")).toBe("Line1 Line2");
    expect(getTextFromHTML("<td>A</td><td>B</td>")).toBe("A B");
    expect(getTextFromHTML("<p>Hello</p><p>World</p>")).toBe("Hello World");
  });

  it("stringifies objects", () => {
    expect(getTextFromHTML({ a: 1 })).toBe('{"a":1}');
  });
});

describe("stripHtmlTags", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtmlTags("<div>a</div>  <div>b</div>")).toBe("a b");
  });
});
