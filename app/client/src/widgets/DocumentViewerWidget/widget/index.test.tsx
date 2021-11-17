import { documentUrlValidation } from ".";

documentUrlValidation;
describe("validate propertypane input : docUrl", () => {
  it("validation for empty value", () => {
    const input1 = "";
    const expected1 = {
      isValid: true,
      parsed: "",
      messages: [""],
    };

    const result = documentUrlValidation(input1);
    expect(result).toStrictEqual(expected1);
  });

  it("validation for invalid url or base64 value", () => {
    const input1 = "htt";
    const expected1 = {
      isValid: false,
      parsed: "",
      messages: ["Provided URL / Base64 is invalid."],
    };

    const result1 = documentUrlValidation(input1);
    expect(result1).toStrictEqual(expected1);

    const input2 = "data:application/pdf;base64";
    const expected2 = {
      isValid: false,
      parsed: "",
      messages: ["Provided URL / Base64 is invalid."],
    };

    const result2 = documentUrlValidation(input2);
    expect(result2).toStrictEqual(expected2);
  });

  it("validation for valid url or base64 value", () => {
    const input1 = "https://www.example.com";
    const expected1 = {
      isValid: true,
      parsed: "https://www.example.com",
    };

    const result1 = documentUrlValidation(input1);
    expect(result1).toStrictEqual(expected1);

    const input2 =
      "data:application/pdf;base64,JVBERi0xLjIgCjkgMCBvYmoKPDwKPj4Kc3RyZWFtCkJULyAzMiBUZiggIFlPVVIgVEVYVCBIRVJFICAgKScgRVQKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgNSAwIFIKL0NvbnRlbnRzIDkgMCBSCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9LaWRzIFs0IDAgUiBdCi9Db3VudCAxCi9UeXBlIC9QYWdlcwovTWVkaWFCb3ggWyAwIDAgMjUwIDUwIF0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1BhZ2VzIDUgMCBSCi9UeXBlIC9DYXRhbG9nCj4+CmVuZG9iagp0cmFpbGVyCjw8Ci9Sb290IDMgMCBSCj4+CiUlRU9G";
    const expected2 = {
      isValid: true,
      parsed: input2,
    };

    const result2 = documentUrlValidation(input2);
    expect(result2).toStrictEqual(expected2);
  });
});
