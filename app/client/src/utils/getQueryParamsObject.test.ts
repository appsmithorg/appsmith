import { getQueryParamsFromString } from "./getQueryParamsObject";

describe("getQueryParamsObject test", () => {
  it("Check whether getQueryParamsFromString returns object with input string containing new lines", () => {
    const output = getQueryParamsFromString(
      "branch=new&text=%3Cp%3EHello%3C%2Fp%3E%0A%3Cp%3EWorld!%3C%2Fp%3E",
    );

    expect(output.text).toEqual("<p>Hello</p>\n<p>World!</p>");
    expect(output.branch).toEqual("new");
  });
});
