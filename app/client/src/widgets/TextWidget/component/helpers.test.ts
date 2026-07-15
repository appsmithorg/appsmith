import { addHttpIfMissing } from "./helpers";

describe("addHttpIfMissing", () => {
  it("prepends http:// to scheme-less URLs", () => {
    expect(addHttpIfMissing("www.appsmith.com")).toBe(
      "http://www.appsmith.com",
    );
    expect(addHttpIfMissing("appsmith.com/docs")).toBe(
      "http://appsmith.com/docs",
    );
  });

  it("leaves http and https URLs untouched", () => {
    expect(addHttpIfMissing("http://appsmith.com")).toBe("http://appsmith.com");
    expect(addHttpIfMissing("https://appsmith.com")).toBe(
      "https://appsmith.com",
    );
    expect(addHttpIfMissing("HTTPS://APPSMITH.COM")).toBe(
      "HTTPS://APPSMITH.COM",
    );
  });

  it("leaves mailto links untouched", () => {
    expect(addHttpIfMissing("mailto:tom@appsmith.com")).toBe(
      "mailto:tom@appsmith.com",
    );
  });

  it("leaves other safe schemes untouched", () => {
    expect(addHttpIfMissing("tel:+14155550123")).toBe("tel:+14155550123");
    expect(addHttpIfMissing("sms:+14155550123")).toBe("sms:+14155550123");
    expect(addHttpIfMissing("ftp://files.appsmith.com")).toBe(
      "ftp://files.appsmith.com",
    );
  });

  it("neutralizes unsafe schemes by prefixing http://", () => {
    expect(addHttpIfMissing("javascript:alert(1)")).toBe(
      "http://javascript:alert(1)",
    );
  });

  it("returns empty values as-is", () => {
    expect(addHttpIfMissing("")).toBe("");
  });
});
