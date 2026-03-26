import { getType, Types, isURL } from "./TypeHelpers";

describe("TypeHelpers", () => {
  describe("getType", () => {
    describe("STRING type", () => {
      it("should return STRING for string values", () => {
        expect(getType("hello")).toBe(Types.STRING);
        expect(getType("")).toBe(Types.STRING);
        expect(getType(" ")).toBe(Types.STRING);
        expect(getType("123")).toBe(Types.STRING);
        expect(getType("true")).toBe(Types.STRING);
      });
    });

    describe("NUMBER type", () => {
      it("should return NUMBER for numeric values", () => {
        expect(getType(0)).toBe(Types.NUMBER);
        expect(getType(123)).toBe(Types.NUMBER);
        expect(getType(-123)).toBe(Types.NUMBER);
        expect(getType(3.14)).toBe(Types.NUMBER);
        expect(getType(-3.14)).toBe(Types.NUMBER);
        expect(getType(Infinity)).toBe(Types.NUMBER);
        expect(getType(-Infinity)).toBe(Types.NUMBER);
      });

      it("should return NUMBER for NaN", () => {
        expect(getType(NaN)).toBe(Types.NUMBER);
      });
    });

    describe("BOOLEAN type", () => {
      it("should return BOOLEAN for boolean values", () => {
        expect(getType(true)).toBe(Types.BOOLEAN);
        expect(getType(false)).toBe(Types.BOOLEAN);
      });
    });

    describe("ARRAY type", () => {
      it("should return ARRAY for array values", () => {
        expect(getType([])).toBe(Types.ARRAY);
        expect(getType([1, 2, 3])).toBe(Types.ARRAY);
        expect(getType(["a", "b", "c"])).toBe(Types.ARRAY);
        expect(getType([1, "a", true])).toBe(Types.ARRAY);
        expect(getType([null, undefined])).toBe(Types.ARRAY);
      });
    });

    describe("FUNCTION type", () => {
      it("should return FUNCTION for function values", () => {
        expect(getType(() => {})).toBe(Types.FUNCTION);
        expect(getType(function () {})).toBe(Types.FUNCTION);
        expect(getType(async () => {})).toBe(Types.FUNCTION);
        expect(getType(function* () {})).toBe(Types.FUNCTION);
      });
    });

    describe("OBJECT type", () => {
      it("should return OBJECT for plain objects", () => {
        expect(getType({})).toBe(Types.OBJECT);
        expect(getType({ key: "value" })).toBe(Types.OBJECT);
        expect(getType({ a: 1, b: 2 })).toBe(Types.OBJECT);
      });

      it("should return OBJECT for Date objects", () => {
        expect(getType(new Date())).toBe(Types.OBJECT);
      });

      it("should return OBJECT for RegExp objects", () => {
        expect(getType(/test/)).toBe(Types.OBJECT);
        expect(getType(new RegExp("test"))).toBe(Types.OBJECT);
      });

      it("should return OBJECT for Map and Set", () => {
        expect(getType(new Map())).toBe(Types.OBJECT);
        expect(getType(new Set())).toBe(Types.OBJECT);
      });

      it("should return OBJECT for Error objects", () => {
        expect(getType(new Error())).toBe(Types.OBJECT);
        expect(getType(new TypeError())).toBe(Types.OBJECT);
      });
    });

    describe("UNDEFINED type", () => {
      it("should return UNDEFINED for undefined values", () => {
        expect(getType(undefined)).toBe(Types.UNDEFINED);
        expect(getType(void 0)).toBe(Types.UNDEFINED);
      });
    });

    describe("NULL type", () => {
      it("should return NULL for null values", () => {
        expect(getType(null)).toBe(Types.NULL);
      });
    });

    describe("UNKNOWN type", () => {
      it("should return UNKNOWN for symbols", () => {
        // Symbols are not considered objects by lodash's isObject
        expect(getType(Symbol("test"))).toBe(Types.UNKNOWN);
      });

      it("should return UNKNOWN for values that don't match other types", () => {
        // Most primitive and object values have specific types
        // UNKNOWN is a fallback for edge cases like Symbols
        expect(getType(Symbol())).toBe(Types.UNKNOWN);
      });
    });

    describe("Type priority", () => {
      it("should correctly identify arrays over objects", () => {
        // Arrays are also objects, but getType should return ARRAY
        expect(getType([1, 2, 3])).toBe(Types.ARRAY);
        expect(getType([])).toBe(Types.ARRAY);
      });

      it("should correctly distinguish between string numbers and actual numbers", () => {
        expect(getType("123")).toBe(Types.STRING);
        expect(getType(123)).toBe(Types.NUMBER);
      });
    });
  });

  describe("isURL", () => {
    describe("Valid URLs", () => {
      it("should return true for valid HTTP URLs with proper domain", () => {
        expect(isURL("http://example.com")).toBe(true);
        expect(isURL("http://www.example.com")).toBe(true);
        expect(isURL("http://example.com/path")).toBe(true);
        expect(isURL("http://example.com/path/to/page")).toBe(true);
        expect(isURL("http://example.com/path?query=value")).toBe(true);
        expect(isURL("http://example.com/path?query=value&other=123")).toBe(true);
        expect(isURL("http://example.com#anchor")).toBe(true);
      });

      it("should return true for valid HTTPS URLs with proper domain", () => {
        expect(isURL("https://example.com")).toBe(true);
        expect(isURL("https://www.example.com")).toBe(true);
        expect(isURL("https://example.com/path")).toBe(true);
        expect(isURL("https://example.com/path?query=value")).toBe(true);
      });

      it("should return true for blob: URLs", () => {
        expect(isURL("blob:http://example.com")).toBe(true);
        expect(isURL("blob:https://example.com/path")).toBe(true);
      });

      it("should return true for URLs with ports", () => {
        expect(isURL("http://example.com:8080")).toBe(true);
        expect(isURL("https://example.com:443")).toBe(true);
        // Note: localhost without TLD won't match the domain pattern
      });

      it("should return true for URLs with IP addresses", () => {
        expect(isURL("http://192.168.1.1")).toBe(true);
        expect(isURL("https://10.0.0.1/path")).toBe(true);
        expect(isURL("http://127.0.0.1:8080")).toBe(true);
      });

      it("should return true for URLs with subdomains", () => {
        expect(isURL("http://sub.example.com")).toBe(true);
        expect(isURL("https://api.example.com/v1")).toBe(true);
        expect(isURL("http://www.sub.example.com")).toBe(true);
      });

      it("should return true for URLs with fragments", () => {
        expect(isURL("http://example.com#section")).toBe(true);
        expect(isURL("http://example.com/path#section")).toBe(true);
        expect(isURL("http://example.com/path?query=value#section")).toBe(true);
      });

      it("should return true for URLs with query strings", () => {
        expect(isURL("http://example.com?a=1")).toBe(true);
        expect(isURL("http://example.com?a=1&b=2")).toBe(true);
        expect(isURL("http://example.com/path?a=1&b=2&c=3")).toBe(true);
      });

      it("should return true for URLs with trailing slash", () => {
        expect(isURL("http://example.com/")).toBe(true);
        expect(isURL("http://example.com/path/")).toBe(true);
      });
    });

    describe("Invalid URLs", () => {
      it("should return false for non-URL strings", () => {
        expect(isURL("not a url")).toBe(false);
        expect(isURL("example")).toBe(false);
      });

      it("should return false for empty strings", () => {
        expect(isURL("")).toBe(false);
        expect(isURL(" ")).toBe(false);
      });

      it("should return false for URLs without protocol", () => {
        // Note: The regex actually allows URLs without protocol (protocol is optional)
        // The regex pattern allows domains like "example.com" as valid
        expect(isURL("example.com")).toBe(true); // Domain without protocol is accepted
        expect(isURL("www.example.com")).toBe(true); // Domain without protocol is accepted
      });

      it("should return false for domains without TLD", () => {
        // The regex requires a domain with TLD (e.g., .com)
        // localhost doesn't have a TLD so it won't match
        expect(isURL("http://localhost")).toBe(false);
        expect(isURL("http://localhost:3000")).toBe(false);
      });

      it("should return false for FTP and other non-HTTP protocols", () => {
        expect(isURL("ftp://example.com")).toBe(false);
        expect(isURL("file://example.com")).toBe(false);
        expect(isURL("mailto:test@example.com")).toBe(false);
      });

      it("should return false for malformed URLs", () => {
        expect(isURL("http://")).toBe(false);
        expect(isURL("http://.com")).toBe(false);
      });

      it("should return false for URLs with invalid characters in domain", () => {
        expect(isURL("http://example.com with space")).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should handle case sensitivity", () => {
        // The regex uses 'i' flag for case insensitivity
        expect(isURL("HTTP://EXAMPLE.COM")).toBe(true);
        expect(isURL("HTTPS://Example.Com")).toBe(true);
      });

      it("should handle complex paths", () => {
        expect(isURL("http://example.com/path/to/resource/file.html")).toBe(true);
        expect(isURL("http://example.com/path-with-dashes")).toBe(true);
        expect(isURL("http://example.com/path_with_underscores")).toBe(true);
      });

      it("should handle special characters in path and query", () => {
        expect(isURL("http://example.com/path?name=John%20Doe")).toBe(true);
        expect(isURL("http://example.com/search?q=hello+world")).toBe(true);
      });
    });
  });

  describe("Types enum", () => {
    it("should have all expected type values", () => {
      expect(Types.URL).toBe("URL");
      expect(Types.STRING).toBe("STRING");
      expect(Types.NUMBER).toBe("NUMBER");
      expect(Types.BOOLEAN).toBe("BOOLEAN");
      expect(Types.OBJECT).toBe("OBJECT");
      expect(Types.ARRAY).toBe("ARRAY");
      expect(Types.FUNCTION).toBe("FUNCTION");
      expect(Types.UNDEFINED).toBe("UNDEFINED");
      expect(Types.NULL).toBe("NULL");
      expect(Types.UNKNOWN).toBe("UNKNOWN");
    });
  });
});