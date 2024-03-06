import { sanitiseSearchParamString } from "./sanitiseSearchParamString";

describe("audit-logs/utils/sanitiseSearchParamString", () => {
  it("returns empty string for empty string input", () => {
    const searchParams = "";
    const actual = sanitiseSearchParamString(searchParams);
    const expected = "";
    expect(actual).toEqual(expected);
  });
  it("returns first chunk after ? when input string starts with ?", () => {
    const searchParams =
      "?emails=test@appsmith.com,user@appsmith.com&events=page.created";
    const actual = sanitiseSearchParamString(searchParams);
    const expected =
      "emails=test@appsmith.com,user@appsmith.com&events=page.created";
    expect(actual).toEqual(expected);
  });
  it("returns first chunk between two ? when input string starts with ?", () => {
    const searchParams =
      "?emails=test@appsmith.com?,user@appsmith.com&events=page.created";
    const actual = sanitiseSearchParamString(searchParams);
    const expected = "emails=test@appsmith.com";
    expect(actual).toEqual(expected);
  });
  it("returns first chunk before ? when input string doesn't start with ?", () => {
    const searchParams =
      "emails=test@appsmith.com?,user@appsmith.com&events=page.created";
    const actual = sanitiseSearchParamString(searchParams);
    const expected = "emails=test@appsmith.com";
    expect(actual).toEqual(expected);
  });
  it("returns whole string if the string doesn't start with ? and have any ?", () => {
    const searchParams =
      "This is a random string and it is going to get returned as it is.";
    const actual = sanitiseSearchParamString(searchParams);
    const expected =
      "This is a random string and it is going to get returned as it is.";
    expect(actual).toEqual(expected);
  });
});
