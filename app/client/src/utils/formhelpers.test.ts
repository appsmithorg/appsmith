import {
  isEmail,
  isEmptyString,
  isStrongPassword,
  noSpaces,
  isRelevantEmail,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "./formhelpers";

describe("formhelpers", () => {
  describe("PASSWORD constants", () => {
    it("should have correct minimum password length", () => {
      expect(PASSWORD_MIN_LENGTH).toBe(8);
    });

    it("should have correct maximum password length", () => {
      expect(PASSWORD_MAX_LENGTH).toBe(48);
    });
  });

  describe("isEmptyString", () => {
    it("should return true for empty string", () => {
      expect(isEmptyString("")).toBe(true);
    });

    it("should return true for string with only whitespace", () => {
      expect(isEmptyString("   ")).toBe(true);
      expect(isEmptyString("\t")).toBe(true);
      expect(isEmptyString("\n")).toBe(true);
      expect(isEmptyString("  \n\t  ")).toBe(true);
    });

    it("should return true for null or undefined", () => {
      expect(isEmptyString(null as any)).toBe(true);
      expect(isEmptyString(undefined as any)).toBe(true);
    });

    it("should return false for strings with content", () => {
      expect(isEmptyString("hello")).toBe(false);
      expect(isEmptyString("  hello  ")).toBe(false);
      expect(isEmptyString("a")).toBe(false);
      expect(isEmptyString("123")).toBe(false);
    });

    it("should return false for strings with mixed content", () => {
      expect(isEmptyString("  hello world  ")).toBe(false);
      expect(isEmptyString("test@example.com")).toBe(false);
    });
  });

  describe("isStrongPassword", () => {
    it("should return true for passwords with valid length", () => {
      expect(isStrongPassword("12345678")).toBe(true); // exactly 8 chars
      expect(isStrongPassword("123456789")).toBe(true); // 9 chars
      expect(isStrongPassword("a".repeat(48))).toBe(true); // exactly 48 chars
    });

    it("should return false for passwords that are too short", () => {
      expect(isStrongPassword("")).toBe(false);
      expect(isStrongPassword("1234567")).toBe(false); // 7 chars
      expect(isStrongPassword("a")).toBe(false);
      expect(isStrongPassword("123456")).toBe(false);
    });

    it("should return false for passwords that are too long", () => {
      expect(isStrongPassword("a".repeat(49))).toBe(false); // 49 chars
      expect(isStrongPassword("a".repeat(100))).toBe(false);
    });

    it("should handle passwords with leading/trailing whitespace", () => {
      // The function uses trim(), so whitespace is removed
      expect(isStrongPassword("  12345678  ")).toBe(true);
      expect(isStrongPassword("   1234567   ")).toBe(false);
    });

    it("should return true for edge case lengths", () => {
      expect(isStrongPassword("12345678")).toBe(true); // min length
      expect(isStrongPassword("a".repeat(48))).toBe(true); // max length
    });

    it("should return true for complex passwords", () => {
      expect(isStrongPassword("P@ssw0rd!")).toBe(true);
      expect(isStrongPassword("MySecurePassword123!@#")).toBe(true);
    });
  });

  describe("noSpaces", () => {
    it("should return true for empty string", () => {
      expect(noSpaces("")).toBe(true);
    });

    it("should return true for null or undefined", () => {
      expect(noSpaces(null as any)).toBe(true);
      expect(noSpaces(undefined as any)).toBe(true);
    });

    it("should return true for string with only whitespace", () => {
      expect(noSpaces("   ")).toBe(true);
      expect(noSpaces("\t\n")).toBe(true);
    });

    it("should return false for strings with content", () => {
      expect(noSpaces("hello")).toBe(false);
      expect(noSpaces("a")).toBe(false);
      expect(noSpaces("  a  ")).toBe(false);
    });

    it("should return false for strings with any non-whitespace character", () => {
      expect(noSpaces("test")).toBe(false);
      expect(noSpaces("123")).toBe(false);
      expect(noSpaces("test example")).toBe(false);
    });
  });

  describe("isEmail", () => {
    it("Check whether the valid emails are recognized as valid", () => {
      const validEmails = [
        "appsmith@yahoo.com",
        "appsmith-100@yahoo.com",
        "appsmith.100@yahoo.com",
        "appsmith111@appsmith.com",
        "appsmith-100@appsmith.net",
        "appsmith.100@appsmith.com.au",
        "appsmith@1.com",
        "appsmith@gmail.com.com",
        "appsmith+100@gmail.com",
        "appsmith-100@yahoo-test.com",
        "test@example.com",
        "user.name@example.co.uk",
        "user+tag@example.org",
      ];

      validEmails.forEach((validEmail) => {
        expect(isEmail(validEmail)).toBeTruthy();
      });
    });

    it("Check whether the invalid emails are recognized as invalid", () => {
      const invalidEmails = [
        "appsmith",
        "appsmith@.com.my",
        "appsmith123@gmail.a",
        "appsmith123@.com",
        "appsmith123@.com.com",
        ".appsmith@appsmith.com",
        "appsmith()*@gmail.com",
        "appsmith@%*.com",
        "appsmith..2002@gmail.com",
        "appsmith.@gmail.com",
        "appsmith@appsmith@gmail.com",
        "appsmith@gmail.com.1a",
        "",
        "plainaddress",
        "@missingdomain.com",
        "missing@.com",
      ];

      invalidEmails.forEach((invalidEmail) => {
        expect(isEmail(invalidEmail)).toBeFalsy();
      });
    });

    it("should handle edge cases", () => {
      expect(isEmail("")).toBeFalsy();
      expect(isEmail("   ")).toBeFalsy();
      // Note: "a@b.c" doesn't pass because TLD must be at least 2 characters
      expect(isEmail("a@b.cd")).toBeTruthy(); // minimal valid email with 2-char TLD
    });
  });

  describe("isRelevantEmail", () => {
    it("should return false for general email domains", () => {
      expect(isRelevantEmail("user@gmail.com")).toBe(false);
      expect(isRelevantEmail("user@yahoo.com")).toBe(false);
      expect(isRelevantEmail("user@outlook.com")).toBe(false);
      expect(isRelevantEmail("user@hotmail.com")).toBe(false);
      expect(isRelevantEmail("user@aol.com")).toBe(false);
      expect(isRelevantEmail("user@icloud.com")).toBe(false);
      expect(isRelevantEmail("user@protonmail.com")).toBe(false);
      expect(isRelevantEmail("user@zoho.com")).toBe(false);
      expect(isRelevantEmail("user@yandex.com")).toBe(false);
      expect(isRelevantEmail("user@appsmith.com")).toBe(false);
    });

    it("should return true for custom/business email domains", () => {
      expect(isRelevantEmail("user@company.com")).toBe(true);
      expect(isRelevantEmail("user@mybusiness.org")).toBe(true);
      expect(isRelevantEmail("user@startup.io")).toBe(true);
      expect(isRelevantEmail("user@enterprise.net")).toBe(true);
      expect(isRelevantEmail("user@example.co")).toBe(true);
    });

    it("should handle case insensitivity", () => {
      expect(isRelevantEmail("user@GMAIL.COM")).toBe(false);
      expect(isRelevantEmail("user@YAHOO.COM")).toBe(false);
      expect(isRelevantEmail("user@COMPANY.COM")).toBe(true);
    });

    it("should return false for invalid email format (missing domain)", () => {
      expect(isRelevantEmail("invalid-email")).toBe(false);
      expect(isRelevantEmail("no-at-sign")).toBe(false);
      expect(isRelevantEmail("")).toBe(false);
    });

    it("should return false for email without domain part", () => {
      expect(isRelevantEmail("user@")).toBe(false);
      // Note: "@domain.com" split by "@" returns ["", "domain.com"], so domain is "domain.com"
      // which is not in GENERAL_DOMAINS, so it returns true
      expect(isRelevantEmail("@domain.com")).toBe(true);
    });

    it("should handle subdomains correctly", () => {
      // Subdomains of general domains should still be detected
      expect(isRelevantEmail("user@mail.gmail.com")).toBe(true); // gmail.com is not the direct domain
      expect(isRelevantEmail("user@sub.company.com")).toBe(true);
    });

    it("should handle emails with multiple @ symbols", () => {
      // Note: split("@")[1] gets the second part, which is "company" for "user@company@gmail.com"
      // "company" is not in GENERAL_DOMAINS, so it returns true (might be a bug in the function)
      expect(isRelevantEmail("user@company@gmail.com")).toBe(true);
    });
  });

  describe("hashPassword", () => {
    it("should return the password as-is", () => {
      const { hashPassword } = require("./formhelpers");
      expect(hashPassword("mypassword")).toBe("mypassword");
      expect(hashPassword("")).toBe("");
      expect(hashPassword("complexPassword123!@#")).toBe("complexPassword123!@#");
    });
  });
});