import { documentUrlValidation } from ".";

describe("validate propertypane input : docUrl", () => {
  it("validation for empty or space value", () => {
    const input1 = "";
    const expected1 = {
      isValid: true,
      parsed: "",
      messages: [""],
    };

    const result = documentUrlValidation(input1);
    expect(result).toStrictEqual(expected1);

    const input2 = "https:  //www.example.com";
    const expected2 = {
      isValid: false,
      parsed: "",
      messages: ["Provided URL / Base64 is invalid."],
    };

    const result1 = documentUrlValidation(input2);
    expect(result1).toStrictEqual(expected2);

    const input3 = "https://www.exam  ple.com";
    const expected3 = {
      isValid: false,
      parsed: "",
      messages: ["Provided URL / Base64 is invalid."],
    };

    const result2 = documentUrlValidation(input3);
    expect(result2).toStrictEqual(expected3);

    const input4 = "https://examplecom";
    const expected4 = {
      isValid: false,
      parsed: "",
      messages: ["Provided URL / Base64 is invalid."],
    };

    const result3 = documentUrlValidation(input4);
    expect(result3).toStrictEqual(expected4);

    const input6 = "://www.appsmith.com/docs/sample.pdf";
    const expected6 = {
      isValid: false,
      parsed: "",
      messages: ["Provided URL / Base64 is invalid."],
    };

    const result5 = documentUrlValidation(input6);
    expect(result5).toStrictEqual(expected6);
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
      parsed: "https://www.example.com/",
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

    const input3 = "https:www.appsmith.com/docs/sample.pdf";
    const expected3 = {
      isValid: true,
      parsed: "https://www.appsmith.com/docs/sample.pdf",
    };

    const result3 = documentUrlValidation(input3);
    expect(result3).toStrictEqual(expected3);

    const input4 = "https://www.apsmith.com/docs/sample";
    const expected4 = {
      isValid: true,
      parsed: "https://www.apsmith.com/docs/sample",
    };

    const result4 = documentUrlValidation(input4);
    expect(result4).toStrictEqual(expected4);

    const input5 =
      "www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf";
    const expected5 = {
      isValid: true,
      parsed:
        "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf",
    };

    const result5 = documentUrlValidation(input5);
    expect(result5).toStrictEqual(expected5);
  });
});
