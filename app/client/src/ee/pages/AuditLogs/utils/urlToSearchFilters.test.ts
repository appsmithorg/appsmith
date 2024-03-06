import { urlToSearchFilters } from "./urlToSearchFilters";

describe("audit-logs/utils/urlToSearchFilters", () => {
  it(`returns proper values for single value of emails search param`, () => {
    const email = "anonymousUser";
    const url = `?emails=${email}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: [email],
    };
    expect(actual).toEqual(expected);
  });
  it(`returns proper values for multiple, comma-separated values of emails search param`, () => {
    const email1 = "anonymousUser";
    const email2 = "test@appsmith.com";
    const url = `?emails=${email1},${email2}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: [email1, email2],
    };
    expect(actual).toEqual(expected);
  });

  it(`returns proper values for single value of events search param`, () => {
    const event = "page.created";
    const url = `?events=${event}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      events: [event],
    };
    expect(actual).toEqual(expected);
  });
  it(`returns proper values for multiple, comma-separated values of events search param`, () => {
    const event1 = "page.created";
    const event2 = "page.updated";
    const url = `?events=${event1},${event2}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      events: [event1, event2],
    };
    expect(actual).toEqual(expected);
  });

  /* days */
  it("returns correct values for all of the date search params", () => {
    const url = "?startDate=12345&endDate=56789";
    const actual = urlToSearchFilters(url);
    const expected = {
      startDate: [12345],
      endDate: [56789],
    };
    expect(actual).toEqual(expected);
  });
  it("returns correct values for missing date search params", () => {
    const cases = ["?startDate=12345", "?endDate=56789"];
    const actual = cases.map((d) => urlToSearchFilters(d));
    const expected = [
      {
        startDate: [12345],
      },
      {
        endDate: [56789],
      },
    ];

    cases.forEach((_, i) => {
      expect(actual[i]).toEqual(expected[i]);
    });
  });

  it("returns default value for unknown search params", () => {
    const sortOrder = "DESC";
    const actual = urlToSearchFilters(`?sortOrder=${sortOrder}`);
    const expected = {
      sortOrder: [sortOrder],
    };
    expect(actual).toEqual(expected);

    const test = "test";
    const actual2 = urlToSearchFilters(`?test=${test}`);
    const expected2 = {
      test: [test],
    };
    expect(actual2).toEqual(expected2);
  });

  it("returns empty object when no values provided for search params", () => {
    const url = `?a&b`;
    const actual = urlToSearchFilters(url);
    const expected = {};
    expect(actual).toEqual(expected);
  });
  it(`returns proper object when values have "?" in values for search params`, () => {
    const url = `?a=te?st&b=te?st`;
    const actual = urlToSearchFilters(url);
    const expected = {
      a: ["te"],
      // /* This won't exist; Check sanitiseSearchParamString */
      // b: [{ id: "te", value: "te", label: "te" }],
    };
    expect(actual).toEqual(expected);
  });
  it(`returns correct object when values have "?" in values for search params`, () => {
    const url = `a=te?st&b=te?st`;
    const actual = urlToSearchFilters(url);
    const expected = {
      a: ["te"],
      // /* This won't exist; Check sanitiseSearchParamString */
      // b: [{ id: "te", value: "te", label: "te" }],
    };
    expect(actual).toEqual(expected);
  });

  it(`returns empty object if input is empty`, () => {
    const url = "";
    const actual = urlToSearchFilters(url);
    const expected = {};
    expect(actual).toEqual(expected);
  });
  it(`returns empty object if input is not passed`, () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const actual = urlToSearchFilters();
    const expected = {};
    expect(actual).toEqual(expected);
  });

  it(`returns object with multiple keys`, () => {
    const emails = "user@appsmith.com";
    const events = "page.created,group.created";
    const startDate = "123456";
    const endDate = "56789";
    const sortOrder = "DESC";
    const url = `?emails=${emails}&events=${events}&startDate=${startDate}&endDate=${endDate}&sortOrder=${sortOrder}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: ["user@appsmith.com"],
      events: ["page.created", "group.created"],
      startDate: [123456],
      endDate: [56789],
      sortOrder: ["DESC"],
    };
    expect(actual).toEqual(expected);
  });

  it("doesn't return empty values", () => {
    const url = "?emails=,,test@appsmith.com&events=,,page.created";
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: ["test@appsmith.com"],
      events: ["page.created"],
    };
    expect(actual).toEqual(expected);
  });
});
