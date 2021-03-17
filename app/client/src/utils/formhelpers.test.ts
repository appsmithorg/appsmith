import { isEmail } from "./formhelpers";

describe("isEmail test", () => {
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
    ];

    invalidEmails.forEach((invalidEmail) => {
      expect(isEmail(invalidEmail)).toBeFalsy();
    });
  });
});
