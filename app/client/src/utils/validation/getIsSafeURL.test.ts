import getIsSafeURL from "./getIsSafeURL";

// Note: getIsSafeURL returns a truthy match array for matching URLs, not a boolean true
// For non-matching URLs, it returns false (for non-strings) or null/falsy (for non-matching strings)

describe("getIsSafeURL", () => {
  describe("Safe URLs", () => {
    describe("HTTP/HTTPS URLs", () => {
      it("should return truthy for valid HTTP URLs", () => {
        expect(getIsSafeURL("http://example.com")).toBeTruthy();
        expect(getIsSafeURL("http://example.com/path")).toBeTruthy();
        expect(getIsSafeURL("http://example.com/path?query=value")).toBeTruthy();
      });

      it("should return truthy for valid HTTPS URLs", () => {
        expect(getIsSafeURL("https://example.com")).toBeTruthy();
        expect(getIsSafeURL("https://example.com/path")).toBeTruthy();
        expect(getIsSafeURL("https://example.com/path?query=value#hash")).toBeTruthy();
      });
    });

    describe("Mailto URLs", () => {
      it("should return truthy for mailto URLs", () => {
        expect(getIsSafeURL("mailto:test@example.com")).toBeTruthy();
        expect(getIsSafeURL("mailto:user@domain.org")).toBeTruthy();
      });
    });

    describe("FTP URLs", () => {
      it("should return truthy for FTP URLs", () => {
        expect(getIsSafeURL("ftp://ftp.example.com")).toBeTruthy();
        expect(getIsSafeURL("ftp://files.example.com/file.txt")).toBeTruthy();
      });
    });

    describe("Tel URLs", () => {
      it("should return truthy for tel URLs", () => {
        expect(getIsSafeURL("tel:+1234567890")).toBeTruthy();
        expect(getIsSafeURL("tel:1234567890")).toBeTruthy();
      });
    });

    describe("File URLs", () => {
      it("should return truthy for file URLs", () => {
        expect(getIsSafeURL("file:///path/to/file")).toBeTruthy();
        expect(getIsSafeURL("file://localhost/path")).toBeTruthy();
      });
    });

    describe("SMS URLs", () => {
      it("should return truthy for sms URLs", () => {
        expect(getIsSafeURL("sms:+1234567890")).toBeTruthy();
        expect(getIsSafeURL("sms:1234567890?body=Hello")).toBeTruthy();
      });
    });
  });

  describe("Data URLs", () => {
    describe("Image data URLs", () => {
      it("should return truthy for valid image data URLs", () => {
        expect(getIsSafeURL("data:image/png;base64,iVBORw0KGgo=")).toBeTruthy();
        expect(getIsSafeURL("data:image/jpeg;base64,/9j/4AAQSkZJ=")).toBeTruthy();
        expect(getIsSafeURL("data:image/gif;base64,R0lGODlh=")).toBeTruthy();
        expect(getIsSafeURL("data:image/bmp;base64,Qk0=")).toBeTruthy();
        expect(getIsSafeURL("data:image/tiff;base64,SUkqAA==")).toBeTruthy();
        expect(getIsSafeURL("data:image/webp;base64,UklGRj==")).toBeTruthy();
      });

      it("should return truthy for image data URLs with different base64 patterns", () => {
        expect(getIsSafeURL("data:image/png;base64,abc123+/==")).toBeTruthy();
        expect(getIsSafeURL("data:image/jpg;base64,xyz789=")).toBeTruthy();
      });
    });

    describe("Video data URLs", () => {
      it("should return truthy for valid video data URLs", () => {
        expect(getIsSafeURL("data:video/mp4;base64,AAAAIGZ0eXBpc29t")).toBeTruthy();
        expect(getIsSafeURL("data:video/mpeg;base64,AAAAGGZ0eXBpc29t")).toBeTruthy();
        expect(getIsSafeURL("data:video/ogg;base64,AAAAGGZ0eXBpc29t")).toBeTruthy();
        expect(getIsSafeURL("data:video/webm;base64,AAAAGGZ0eXBpc29t")).toBeTruthy();
      });
    });

    describe("Audio data URLs", () => {
      it("should return truthy for valid audio data URLs", () => {
        expect(getIsSafeURL("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0U=")).toBeTruthy();
        expect(getIsSafeURL("data:audio/oga;base64,SUQzBAAAAAAAI1RTU0U=")).toBeTruthy();
        expect(getIsSafeURL("data:audio/ogg;base64,SUQzBAAAAAAAI1RTU0U=")).toBeTruthy();
        expect(getIsSafeURL("data:audio/opus;base64,SUQzBAAAAAAAI1RTU0U=")).toBeTruthy();
      });
    });

    describe("Invalid data URLs", () => {
      it("should return falsy for data URLs with unsupported MIME types", () => {
        expect(getIsSafeURL("data:text/html;base64,PGh0bWw+")).toBeFalsy();
        expect(getIsSafeURL("data:text/javascript;base64,YWxlcnQoMSk=")).toBeFalsy();
        expect(getIsSafeURL("data:application/pdf;base64,JVBERi0xLjQ=")).toBeFalsy();
        expect(getIsSafeURL("data:application/json;base64,eyAiYWJjIjogMTIzIH0=")).toBeFalsy();
      });

      it("should return falsy for data URLs without base64 encoding", () => {
        expect(getIsSafeURL("data:text/plain,Hello World")).toBeFalsy();
        expect(getIsSafeURL("data:text/html,<script>alert(1)</script>")).toBeFalsy();
      });
    });
  });

  describe("Unsafe URLs", () => {
    describe("JavaScript URLs", () => {
      it("should return falsy for javascript: URLs", () => {
        expect(getIsSafeURL("javascript:alert(1)")).toBeFalsy();
        expect(getIsSafeURL("javascript:void(0)")).toBeFalsy();
        expect(getIsSafeURL("javascript:window.location='http://evil.com'")).toBeFalsy();
      });
    });

    describe("Data URLs with malicious content", () => {
      it("should return falsy for data URLs that could execute scripts", () => {
        expect(getIsSafeURL("data:text/html,<script>alert(1)</script>")).toBeFalsy();
        expect(getIsSafeURL("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBeFalsy();
      });
    });

    describe("Other unsafe protocols", () => {
      it("should return falsy for vbscript: URLs", () => {
        expect(getIsSafeURL("vbscript:msgbox(1)")).toBeFalsy();
      });

      it("should return falsy for data URLs with HTML", () => {
        expect(getIsSafeURL("data:text/html;charset=utf-8,<html></html>")).toBeFalsy();
      });
    });
  });

  describe("Relative URLs and paths", () => {
    it("should return truthy for relative paths", () => {
      expect(getIsSafeURL("/path/to/resource")).toBeTruthy();
      expect(getIsSafeURL("path/to/resource")).toBeTruthy();
      expect(getIsSafeURL("./relative/path")).toBeTruthy();
      expect(getIsSafeURL("../parent/path")).toBeTruthy();
    });

    it("should return truthy for paths with query strings", () => {
      expect(getIsSafeURL("/path?query=value")).toBeTruthy();
      expect(getIsSafeURL("path?a=1&b=2")).toBeTruthy();
    });

    it("should return truthy for paths with fragments", () => {
      expect(getIsSafeURL("/path#section")).toBeTruthy();
      expect(getIsSafeURL("#anchor")).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("should return falsy for non-string input", () => {
      expect(getIsSafeURL(null as any)).toBeFalsy();
      expect(getIsSafeURL(undefined as any)).toBeFalsy();
      expect(getIsSafeURL(123 as any)).toBeFalsy();
      expect(getIsSafeURL({} as any)).toBeFalsy();
    });

    it("should return truthy for empty string", () => {
      // Note: The regex pattern matches empty string because [^&:/?#]* can match zero characters
      // followed by $ which is end of string
      expect(getIsSafeURL("")).toBeTruthy();
    });

    it("should handle URLs with special characters in path", () => {
      expect(getIsSafeURL("http://example.com/path%20with%20spaces")).toBeTruthy();
      expect(getIsSafeURL("http://example.com/path?query=value&other=123")).toBeTruthy();
    });

    it("should handle case insensitivity for MIME types", () => {
      expect(getIsSafeURL("data:IMAGE/png;base64,iVBORw0KGgo=")).toBeTruthy();
      expect(getIsSafeURL("data:Image/Png;base64,iVBORw0KGgo=")).toBeTruthy();
    });
  });

  describe("URL safety validation", () => {
    it("should prevent XSS via javascript: protocol", () => {
      const xssPayloads = [
        "javascript:alert(document.cookie)",
        "javascript:window.location='http://evil.com'",
        "javascript:void(document.body.innerHTML='<img src=x onerror=alert(1)>')",
      ];

      xssPayloads.forEach((payload) => {
        expect(getIsSafeURL(payload)).toBeFalsy();
      });
    });

    it("should prevent XSS via data: URLs with HTML", () => {
      const htmlPayloads = [
        "data:text/html,<script>alert(1)</script>",
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "data:text/html,<img src=x onerror=alert(1)>",
      ];

      htmlPayloads.forEach((payload) => {
        expect(getIsSafeURL(payload)).toBeFalsy();
      });
    });

    it("should allow safe image data URLs", () => {
      const safeImageUrls = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQAhEDEQAAL+fgA//9k=",
      ];

      safeImageUrls.forEach((url) => {
        expect(getIsSafeURL(url)).toBeTruthy();
      });
    });
  });
});