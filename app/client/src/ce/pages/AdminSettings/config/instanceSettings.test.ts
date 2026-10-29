import { APPSMITH_CUSTOM_DOMAINS } from "./instanceSettings";

describe("APPSMITH_CUSTOM_DOMAINS validation", () => {
  const validate = (value: string) =>
    APPSMITH_CUSTOM_DOMAINS.validate?.(value, APPSMITH_CUSTOM_DOMAINS);

  // A port and a trailing dot are valid in a Caddy site address, so both are accepted on purpose.
  it.each([
    "",
    "   ",
    "apps.example.com",
    "example.com",
    "apps.example.com:8443",
    "apps.example.com.",
  ])("accepts %p", (value) => {
    expect(validate(value)).toBeUndefined();
  });

  it("accepts a missing value", () => {
    expect(validate(undefined as unknown as string)).toBeUndefined();
  });

  it.each([
    "https://apps.example.com",
    "http://apps.example.com",
    "HTTPS://apps.example.com",
    "ftp://apps.example.com",
  ])("refuses %p because it has a protocol", (value) => {
    expect(validate(value)).toContain("Remove http:// or https://");
  });

  it.each([
    "apps.example.com/",
    "apps.example.com/app",
    "apps example.com",
    " apps.example.com ",
  ])("refuses %p because it has a path or a space", (value) => {
    expect(validate(value)).toContain("without a path or spaces");
  });
});
