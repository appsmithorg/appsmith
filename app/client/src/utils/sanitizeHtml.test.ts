import sanitizeHtml from "./sanitizeHtml";

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    const dirty = "<p>ok<script>alert(1)</script></p>";
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<p>ok</p>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("alert(1)");
  });

  it("removes inline event handlers", () => {
    const dirty = '<img src="https://example.com/a.png" onerror="alert(1)" />';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<img");
    expect(clean).toContain("src=");
    expect(clean).not.toContain("onerror");
  });

  it("removes unsafe javascript: links", () => {
    const dirty = '<a href="javascript:alert(1)">click</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<a");
    expect(clean).not.toContain("href=");
  });

  it("adds rel=noopener noreferrer for target=_blank", () => {
    const dirty = '<a href="https://example.com" target="_blank">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });
});

