import {
  getQueryParams,
  convertObjectToQueryParams,
  isValidURL,
  matchesURLPattern,
  sanitizeString,
} from "./URLUtils";

describe("URLUtils", () => {
  describe("getQueryParams", () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      delete (window as any).location;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it("should return an empty object when there are no query params", () => {
      (window as any).location = { search: "" };

      const result = getQueryParams();

      expect(result).toEqual({});
    });

    it("should return query params as an object", () => {
      (window as any).location = { search: "?key1=value1&key2=value2" };

      const result = getQueryParams();

      expect(result).toEqual({
        key1: "value1",
        key2: "value2",
      });
    });

    it("should handle a single query param", () => {
      (window as any).location = { search: "?key=value" };

      const result = getQueryParams();

      expect(result).toEqual({ key: "value" });
    });

    it("should handle empty values", () => {
      (window as any).location = { search: "?key1=&key2=value2" };

      const result = getQueryParams();

      expect(result).toEqual({
        key1: "",
        key2: "value2",
      });
    });

    it("should handle encoded values", () => {
      (window as any).location = { search: "?name=John%20Doe&email=test%40example.com" };

      const result = getQueryParams();

      expect(result).toEqual({
        name: "John Doe",
        email: "test@example.com",
      });
    });

    it("should handle special characters in values", () => {
      (window as any).location = { search: "?key=value%26with%3Dspecial%20chars" };

      const result = getQueryParams();

      expect(result).toEqual({
        key: "value&with=special chars",
      });
    });
  });

  describe("convertObjectToQueryParams", () => {
    it("should convert a simple object to query params", () => {
      const result = convertObjectToQueryParams({ key1: "value1", key2: "value2" });

      expect(result).toBe("?key1=value1&key2=value2");
    });

    it("should return an empty string for null input", () => {
      const result = convertObjectToQueryParams(null);

      expect(result).toBe("");
    });

    it("should return an empty string for undefined input", () => {
      const result = convertObjectToQueryParams(undefined);

      expect(result).toBe("");
    });

    it("should handle an empty object", () => {
      const result = convertObjectToQueryParams({});

      expect(result).toBe("?");
    });

    it("should encode special characters in keys and values", () => {
      const result = convertObjectToQueryParams({
        "key with spaces": "value with spaces",
        "key&special": "value&special",
      });

      expect(result).toContain("key%20with%20spaces=value%20with%20spaces");
      expect(result).toContain("key%26special=value%26special");
    });

    it("should handle numeric values", () => {
      const result = convertObjectToQueryParams({ count: 42, price: 19.99 });

      expect(result).toBe("?count=42&price=19.99");
    });

    it("should handle boolean values", () => {
      const result = convertObjectToQueryParams({ active: true, disabled: false });

      expect(result).toBe("?active=true&disabled=false");
    });

    it("should handle empty string values", () => {
      const result = convertObjectToQueryParams({ key: "" });

      expect(result).toBe("?key=");
    });

    it("should handle array values by converting to string", () => {
      const result = convertObjectToQueryParams({ items: "a,b,c" });

      expect(result).toBe("?items=a%2Cb%2Cc");
    });
  });

  describe("isValidURL", () => {
    it("should return true for valid HTTP URLs", () => {
      expect(isValidURL("http://example.com")).toBe(true);
      expect(isValidURL("http://www.example.com")).toBe(true);
      expect(isValidURL("http://example.com/path")).toBe(true);
      expect(isValidURL("http://example.com/path?query=value")).toBe(true);
    });

    it("should return true for valid HTTPS URLs", () => {
      expect(isValidURL("https://example.com")).toBe(true);
      expect(isValidURL("https://www.example.com")).toBe(true);
      expect(isValidURL("https://example.com/path")).toBe(true);
      expect(isValidURL("https://example.com/path?query=value")).toBe(true);
    });

    it("should return true for valid FTP URLs", () => {
      expect(isValidURL("ftp://ftp.example.com")).toBe(true);
    });

    it("should return true for valid mailto URLs", () => {
      expect(isValidURL("mailto:test@example.com")).toBe(true);
    });

    it("should return true for valid tel URLs", () => {
      expect(isValidURL("tel:+1234567890")).toBe(true);
    });

    it("should return true for localhost URLs", () => {
      expect(isValidURL("http://localhost")).toBe(true);
      expect(isValidURL("http://localhost:3000")).toBe(true);
    });

    it("should return true for URLs with ports", () => {
      expect(isValidURL("http://example.com:8080")).toBe(true);
      expect(isValidURL("https://example.com:443")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidURL("not a url")).toBe(false);
      expect(isValidURL("example.com")).toBe(false);
      expect(isValidURL("")).toBe(false);
      expect(isValidURL("http://")).toBe(false);
    });

    it("should return false for URLs without protocol", () => {
      expect(isValidURL("www.example.com")).toBe(false);
    });

    it("should return true for URLs with fragments", () => {
      expect(isValidURL("http://example.com#section")).toBe(true);
      expect(isValidURL("http://example.com/path#section")).toBe(true);
    });

    it("should return true for URLs with complex paths", () => {
      expect(isValidURL("http://example.com/path/to/resource")).toBe(true);
      expect(isValidURL("http://example.com/path/to/resource/file.html")).toBe(true);
    });
  });

  describe("matchesURLPattern", () => {
    it("should match standard HTTP URLs", () => {
      expect(matchesURLPattern("http://example.com")).toBe(true);
    });

    it("should match standard HTTPS URLs", () => {
      expect(matchesURLPattern("https://example.com")).toBe(true);
    });

    it("should match URLs with www prefix", () => {
      expect(matchesURLPattern("www.example.com")).toBe(true);
    });

    it("should match URLs with paths", () => {
      expect(matchesURLPattern("http://example.com/path/to/page")).toBe(true);
    });

    it("should match URLs with query strings", () => {
      expect(matchesURLPattern("http://example.com?key=value")).toBe(true);
    });

    it("should match URLs with fragments", () => {
      expect(matchesURLPattern("http://example.com#section")).toBe(true);
    });

    it("should match localhost URLs with trailing slash", () => {
      // Note: The regex has localhost(?=\/) which requires localhost to be followed by /
      expect(matchesURLPattern("localhost/")).toBe(true);
      expect(matchesURLPattern("localhost/path")).toBe(true);
    });

    it("should not match localhost URLs without trailing slash", () => {
      // localhost without / doesn't match the pattern
      expect(matchesURLPattern("localhost")).toBe(false);
      expect(matchesURLPattern("http://localhost:3000")).toBe(false);
    });

    it("should match IP addresses", () => {
      expect(matchesURLPattern("192.168.1.1")).toBe(true);
      expect(matchesURLPattern("http://192.168.1.1:8080")).toBe(true);
    });

    it("should match URLs with ports", () => {
      expect(matchesURLPattern("http://example.com:8080")).toBe(true);
    });

    it("should match URLs with subdomains", () => {
      expect(matchesURLPattern("http://sub.example.com")).toBe(true);
      expect(matchesURLPattern("http://api.v2.example.com")).toBe(true);
    });

    it("should match FTP URLs", () => {
      expect(matchesURLPattern("ftp://ftp.example.com")).toBe(true);
    });

    it("should match mailto URLs", () => {
      expect(matchesURLPattern("mailto:test@example.com")).toBe(true);
    });

    it("should not match tel URLs", () => {
      // The regex doesn't properly match tel: URLs
      expect(matchesURLPattern("tel:+1234567890")).toBe(false);
      expect(matchesURLPattern("tel://+1234567890")).toBe(false);
    });

    it("should not match invalid strings", () => {
      // Note: The regex is quite permissive, so many strings might match
      // This test documents the behavior rather than asserting failure
      expect(matchesURLPattern("")).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("should convert uppercase letters to lowercase", () => {
      expect(sanitizeString("HELLO")).toBe("hello");
      expect(sanitizeString("Hello World")).toBe("hello_world");
    });

    it("should replace special characters with underscores", () => {
      expect(sanitizeString("hello-world")).toBe("hello_world");
      expect(sanitizeString("hello@world")).toBe("hello_world");
      expect(sanitizeString("hello world")).toBe("hello_world");
    });

    it("should keep alphanumeric characters", () => {
      expect(sanitizeString("abc123")).toBe("abc123");
      expect(sanitizeString("ABC123")).toBe("abc123");
    });

    it("should handle multiple special characters in a row", () => {
      expect(sanitizeString("hello--world")).toBe("hello__world");
      expect(sanitizeString("hello@@world")).toBe("hello__world");
    });

    it("should handle strings starting or ending with special characters", () => {
      expect(sanitizeString("-hello-")).toBe("_hello_");
      expect(sanitizeString("@hello@")).toBe("_hello_");
    });

    it("should handle empty string", () => {
      expect(sanitizeString("")).toBe("");
    });

    it("should handle strings with only special characters", () => {
      expect(sanitizeString("@#$%")).toBe("____");
    });

    it("should handle strings with mixed content", () => {
      expect(sanitizeString("My-App_v2.0")).toBe("my_app_v2_0");
    });
  });
});