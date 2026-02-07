import sanitizeHtml from "./sanitizeHtml";

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    const dirty = "<p>ok<script>alert(1)</script></p>";
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<p>ok</p>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("alert(1)");
  });

  it("removes style tags", () => {
    const dirty = "<div>ok<style>body{background:red}</style>end</div>";
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<div>okend</div>");
    expect(clean).not.toContain("<style");
    expect(clean).not.toContain("background");
  });

  it("removes iframe/object/embed tags (including their contents)", () => {
    const dirty =
      '<div>ok<iframe><img src="https://example.com/a.png" onerror="alert(1)" /></iframe><object>nope</object><embed src="https://example.com/x" />end</div>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<div>okend</div>");
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("<object");
    expect(clean).not.toContain("<embed");
    expect(clean).not.toContain("alert(1)");
  });

  it("drops svg/math content entirely (defense-in-depth)", () => {
    const dirty =
      '<div>ok<svg onload="alert(1)"><foreignObject><img src="https://example.com/a.png" onerror="alert(2)" /></foreignObject></svg><math><mtext>alert(3)</mtext></math>end</div>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<div>okend</div>");
    expect(clean).not.toContain("<svg");
    expect(clean).not.toContain("<math");
    expect(clean).not.toContain("alert(1)");
    expect(clean).not.toContain("alert(2)");
    expect(clean).not.toContain("alert(3)");
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

  it("strips data: links from <a href>", () => {
    const dirty = '<a href="data:image/png;base64,AAA=">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain("<a");
    expect(clean).not.toContain("href=");
  });

  it("allows safe data:image URLs on <img src>", () => {
    const dirty = '<img src="data:image/png;base64,AAA=" alt="x" />';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('src="data:image/png;base64,AAA="');
    expect(clean).toContain('alt="x"');
  });

  it("adds rel=noopener noreferrer for target=_blank", () => {
    const dirty = '<a href="https://example.com" target="_blank">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it("removes HTML comments", () => {
    const dirty = "<div>ok<!-- comment --></div>";
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe("<div>ok</div>");
    expect(clean).not.toContain("<!--");
  });

  it("strips style attributes from allowed tags", () => {
    const dirty = '<code style="color:red">x</code>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe("<code>x</code>");
    expect(clean).not.toContain("style=");
  });

  it("preserves allowed tags/attributes (positive case)", () => {
    const dirty = '<a href="https://example.com" title="t">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('title="t"');
  });

  it("handles empty and non-string input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml("   ")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml(123)).toBe("");
  });
});
