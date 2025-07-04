import {
  trackCurrentDomain,
  getRecentDomains,
  clearRecentDomains,
  isValidAppsmithDomain,
} from "./multiOrgDomains";

const MOCK_DATE = 1609459200000;

Date.now = jest.fn(() => MOCK_DATE);

const mockLocation = {
  hostname: "test.appsmith.com",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

let cookieStore = "";

Object.defineProperty(document, "cookie", {
  get: jest.fn(() => cookieStore),
  set: jest.fn((cookieString: string) => {
    if (cookieString.includes("expires=Thu, 01 Jan 1970")) {
      cookieStore = "";
    } else {
      const [nameValue] = cookieString.split(";");

      cookieStore = nameValue;
    }
  }),
  configurable: true,
});

const mockCookieGetter = Object.getOwnPropertyDescriptor(document, "cookie")
  ?.get as jest.MockedFunction<() => string>;
const mockCookieSetter = Object.getOwnPropertyDescriptor(document, "cookie")
  ?.set as jest.MockedFunction<(value: string) => void>;

describe("multiOrgDomains", () => {
  beforeEach(() => {
    cookieStore = "";
    mockLocation.hostname = "test.appsmith.com";

    (Date.now as jest.Mock).mockClear();
    mockCookieGetter.mockClear();
    mockCookieSetter?.mockClear?.();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("isValidAppsmithDomain", () => {
    it("should return true for valid appsmith domains", () => {
      expect(isValidAppsmithDomain("example.appsmith.com")).toBe(true);
      expect(isValidAppsmithDomain("company.appsmith.com")).toBe(true);
      expect(isValidAppsmithDomain("test-org.appsmith.com")).toBe(true);
    });

    it("should return false for invalid appsmith domains", () => {
      expect(isValidAppsmithDomain("example.com")).toBe(false);
      expect(isValidAppsmithDomain("example.appsmith.co")).toBe(false);
      expect(isValidAppsmithDomain("appsmith.com")).toBe(false);
    });

    it("should return false for excluded appsmith subdomains", () => {
      expect(isValidAppsmithDomain("login.appsmith.com")).toBe(false);
      expect(isValidAppsmithDomain("release.appsmith.com")).toBe(false);
      expect(isValidAppsmithDomain("app.appsmith.com")).toBe(false);
      expect(isValidAppsmithDomain("dev.appsmith.com")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidAppsmithDomain("")).toBe(false);
      expect(isValidAppsmithDomain("login.test.appsmith.com")).toBe(false);
      expect(isValidAppsmithDomain("test.login.appsmith.com")).toBe(true);
    });
  });

  describe("trackCurrentDomain", () => {
    it("should track current domain when it's a valid multi-org domain", () => {
      mockLocation.hostname = "example.appsmith.com";

      trackCurrentDomain();

      expect(mockCookieSetter).toHaveBeenCalledWith(
        expect.stringContaining("appsmith_recent_domains="),
      );
    });

    it("should not track domain when it's not a valid multi-org domain", () => {
      mockLocation.hostname = "example.com";

      trackCurrentDomain();

      expect(mockCookieSetter).not.toHaveBeenCalled();
    });

    it("should not track excluded appsmith domains", () => {
      mockLocation.hostname = "login.appsmith.com";

      trackCurrentDomain();

      expect(mockCookieSetter).not.toHaveBeenCalled();
    });

    it("should add current domain to the beginning of the list", () => {
      mockLocation.hostname = "example.appsmith.com";

      const existingDomains = [
        { domain: "other.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "another.appsmith.com", timestamp: MOCK_DATE - 200000 },
      ];

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(existingDomains))}`;

      trackCurrentDomain();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];
      const cookieValue = setCookieCall.split("=")[1].split(";")[0];
      const decodedDomains = JSON.parse(decodeURIComponent(cookieValue));

      expect(decodedDomains[0].domain).toBe("example.appsmith.com");
      expect(decodedDomains[0].timestamp).toBe(MOCK_DATE);
    });

    it("should remove duplicate entries of current domain", () => {
      mockLocation.hostname = "example.appsmith.com";

      const existingDomains = [
        { domain: "other.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "example.appsmith.com", timestamp: MOCK_DATE - 150000 },
        { domain: "another.appsmith.com", timestamp: MOCK_DATE - 200000 },
      ];

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(existingDomains))}`;

      trackCurrentDomain();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];
      const cookieValue = setCookieCall.split("=")[1].split(";")[0];
      const decodedDomains = JSON.parse(decodeURIComponent(cookieValue));

      const exampleDomains = decodedDomains.filter(
        (d: { domain: string }) => d.domain === "example.appsmith.com",
      );

      expect(exampleDomains).toHaveLength(1);
      expect(exampleDomains[0].timestamp).toBe(MOCK_DATE);
    });

    it("should limit stored domains to MAX_DOMAINS (10)", () => {
      mockLocation.hostname = "example.appsmith.com";

      const existingDomains = Array.from({ length: 10 }, (_, i) => ({
        domain: `domain${i}.appsmith.com`,
        timestamp: MOCK_DATE - (i + 1) * 1000,
      }));

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(existingDomains))}`;

      trackCurrentDomain();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];
      const cookieValue = setCookieCall.split("=")[1].split(";")[0];
      const decodedDomains = JSON.parse(decodeURIComponent(cookieValue));

      expect(decodedDomains).toHaveLength(10);
      expect(decodedDomains[0].domain).toBe("example.appsmith.com");
      expect(
        decodedDomains.some(
          (d: { domain: string }) => d.domain === "domain9.appsmith.com",
        ),
      ).toBe(false);
    });

    it("should filter out domains older than 30 days", () => {
      mockLocation.hostname = "example.appsmith.com";

      const thirtyOneDaysAgo = MOCK_DATE - 31 * 24 * 60 * 60 * 1000;
      const existingDomains = [
        { domain: "recent.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "old.appsmith.com", timestamp: thirtyOneDaysAgo },
      ];

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(existingDomains))}`;

      trackCurrentDomain();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];
      const cookieValue = setCookieCall.split("=")[1].split(";")[0];
      const decodedDomains = JSON.parse(decodeURIComponent(cookieValue));

      expect(decodedDomains).toHaveLength(2); // current + recent
      expect(
        decodedDomains.some(
          (d: { domain: string }) => d.domain === "old.appsmith.com",
        ),
      ).toBe(false);
      expect(
        decodedDomains.some(
          (d: { domain: string }) => d.domain === "recent.appsmith.com",
        ),
      ).toBe(true);
    });

    it("should handle invalid cookie data gracefully", () => {
      mockLocation.hostname = "example.appsmith.com";
      cookieStore = "appsmith_recent_domains=invalid-json";

      expect(() => trackCurrentDomain()).not.toThrow();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];

      expect(setCookieCall).toContain("appsmith_recent_domains=");
    });
  });

  describe("getRecentDomains", () => {
    it("should return empty array when no domains are stored", () => {
      const result = getRecentDomains();

      expect(result).toEqual([]);
    });

    it("should return recent domains excluding current domain", () => {
      mockLocation.hostname = "current.appsmith.com";

      const storedDomains = [
        { domain: "current.appsmith.com", timestamp: MOCK_DATE },
        { domain: "other.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "another.appsmith.com", timestamp: MOCK_DATE - 200000 },
      ];

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(storedDomains))}`;

      const result = getRecentDomains();

      expect(result).toEqual(["other.appsmith.com", "another.appsmith.com"]);
    });

    it("should filter out domains older than 30 days", () => {
      const thirtyOneDaysAgo = MOCK_DATE - 31 * 24 * 60 * 60 * 1000;
      const storedDomains = [
        { domain: "recent.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "old.appsmith.com", timestamp: thirtyOneDaysAgo },
      ];

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(storedDomains))}`;

      const result = getRecentDomains();

      expect(result).toEqual(["recent.appsmith.com"]);
    });

    it("should filter out invalid appsmith domains", () => {
      const storedDomains = [
        { domain: "valid.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "login.appsmith.com", timestamp: MOCK_DATE - 100000 },
        { domain: "invalid.com", timestamp: MOCK_DATE - 100000 },
      ];

      cookieStore = `appsmith_recent_domains=${encodeURIComponent(JSON.stringify(storedDomains))}`;

      const result = getRecentDomains();

      expect(result).toEqual(["valid.appsmith.com"]);
    });

    it("should handle invalid cookie data gracefully", () => {
      cookieStore = "appsmith_recent_domains=invalid-json";

      const result = getRecentDomains();

      expect(result).toEqual([]);
    });

    it("should handle missing cookie gracefully", () => {
      const result = getRecentDomains();

      expect(result).toEqual([]);
    });
  });

  describe("clearRecentDomains", () => {
    it("should clear the recent domains cookie", () => {
      clearRecentDomains();

      expect(mockCookieSetter).toHaveBeenCalledWith(
        "appsmith_recent_domains=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.appsmith.com; path=/;",
      );
    });

    it("should remove domains from storage", () => {
      cookieStore = "appsmith_recent_domains=some-value";

      clearRecentDomains();

      expect(cookieStore).toBe("");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle malformed cookie strings", () => {
      mockLocation.hostname = "test.appsmith.com";

      cookieStore = "malformed cookie string without proper format";

      expect(() => getRecentDomains()).not.toThrow();
      expect(() => trackCurrentDomain()).not.toThrow();
    });

    it("should handle empty domain strings", () => {
      expect(isValidAppsmithDomain("")).toBe(false);
    });

    it("should handle special characters in domain names", () => {
      expect(isValidAppsmithDomain("test-org.appsmith.com")).toBe(true);
      expect(isValidAppsmithDomain("test_org.appsmith.com")).toBe(true);
      expect(isValidAppsmithDomain("test.org.appsmith.com")).toBe(true);
    });
  });

  describe("cookie management", () => {
    it("should set cookie with correct expiry date", () => {
      mockLocation.hostname = "example.appsmith.com";

      trackCurrentDomain();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];

      expect(setCookieCall).toContain("expires=");
      expect(setCookieCall).toContain("domain=.appsmith.com");
      expect(setCookieCall).toContain("path=/");
      expect(setCookieCall).toContain("SameSite=Lax");
    });

    it("should encode cookie values properly", () => {
      mockLocation.hostname = "example.appsmith.com";

      trackCurrentDomain();

      const setCookieCall = mockCookieSetter.mock.calls[0][0];
      const cookieValue = setCookieCall.split("=")[1].split(";")[0];

      expect(() => {
        const decoded = decodeURIComponent(cookieValue);

        JSON.parse(decoded);
      }).not.toThrow();
    });
  });
});
