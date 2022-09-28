import { urlToSearchFilters } from "./urlToSearchFilters";

describe("audit-logs/utils/urlToSearchFilters", () => {
  it(`returns proper values for single value of emails search param`, () => {
    const email = "anonymousUser";
    const url = `?emails=${email}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: [{ id: email, value: email, label: email }],
    };
    expect(actual).toEqual(expected);
  });
  it(`returns proper values for multiple, comma-separated values of emails search param`, () => {
    const email1 = "anonymousUser";
    const email2 = "test@appsmith.com";
    const url = `?emails=${email1},${email2}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: [
        { id: email1, value: email1, label: email1 },
        { id: email2, value: email2, label: email2 },
      ],
    };
    expect(actual).toEqual(expected);
  });

  it(`returns proper values for single value of events search param`, () => {
    const event = "page.created";
    const url = `?events=${event}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      events: [{ id: event, value: event, label: "Page created" }],
    };
    expect(actual).toEqual(expected);
  });
  it(`returns proper values for multiple, comma-separated values of events search param`, () => {
    const event1 = "page.created";
    const event2 = "page.updated";
    const url = `?events=${event1},${event2}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      events: [
        { id: event1, value: event1, label: "Page created" },
        { id: event2, value: event2, label: "Page updated" },
      ],
    };
    expect(actual).toEqual(expected);
  });

  /* days */
  it("returns correct values for all of the days search param", () => {
    const cases = [0, 1, 2, 8, 31];
    const actual = cases.map((d) => urlToSearchFilters(`?days=${d}`));
    // const expected = cases.map((d) => ({ days: [toDate(d.toString())] })); /* for debugging */
    const expected = [
      {
        days: [
          {
            label: "Select",
            value: "0",
            id: "no-value",
          },
        ],
      },
      {
        days: [
          {
            label: "Today",
            value: "1",
            id: "today",
          },
        ],
      },
      {
        days: [
          {
            label: "Yesterday",
            value: "2",
            id: "yesterday",
          },
        ],
      },
      {
        days: [
          {
            label: "Last 7 days",
            value: "8",
            id: "last-7",
          },
        ],
      },
      {
        days: [
          {
            label: "Last 30 days",
            value: "31",
            id: "last-30",
          },
        ],
      },
    ];

    cases.forEach((_, i) => {
      expect(actual[i]).toEqual(expected[i]);
    });
  });
  it("returns default values for unsupported values of the days search param", () => {
    const cases = [-1, 3, 10, 80, 310];
    const actual = cases.map((d) => urlToSearchFilters(`?days=${d}`));
    // const expected = cases.map((d) => ({ days: [toDate(d.toString())] })); /* for debugging */
    const expected = [
      {
        days: [
          {
            label: "Select",
            value: "0",
            id: "no-value",
          },
        ],
      },
      {
        days: [
          {
            label: "Select",
            value: "0",
            id: "no-value",
          },
        ],
      },
      {
        days: [
          {
            label: "Select",
            value: "0",
            id: "no-value",
          },
        ],
      },
      {
        days: [
          {
            label: "Select",
            value: "0",
            id: "no-value",
          },
        ],
      },
      {
        days: [
          {
            label: "Select",
            value: "0",
            id: "no-value",
          },
        ],
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
      sortOrder: [{ id: sortOrder, value: sortOrder, label: sortOrder }],
    };
    expect(actual).toEqual(expected);

    const test = "test";
    const actual2 = urlToSearchFilters(`?test=${test}`);
    const expected2 = {
      test: [{ id: test, value: test, label: test }],
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
      a: [{ id: "te", value: "te", label: "te" }],
      // /* This won't exist; Check sanitiseSearchParamString */
      // b: [{ id: "te", value: "te", label: "te" }],
    };
    expect(actual).toEqual(expected);
  });
  it(`returns correct object when values have "?" in values for search params`, () => {
    const url = `a=te?st&b=te?st`;
    const actual = urlToSearchFilters(url);
    const expected = {
      a: [{ id: "te", value: "te", label: "te" }],
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
    const days = "8";
    const sortOrder = "DESC";
    const url = `?emails=${emails}&events=${events}&days=${days}&sortOrder=${sortOrder}`;
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: [
        {
          id: "user@appsmith.com",
          label: "user@appsmith.com",
          value: "user@appsmith.com",
        },
      ],
      events: [
        {
          id: "page.created",
          label: "Page created",
          value: "page.created",
        },
        {
          id: "group.created",
          label: "Group created",
          value: "group.created",
        },
      ],
      days: [
        {
          id: "last-7",
          label: "Last 7 days",
          value: "8",
        },
      ],
      sortOrder: [
        {
          id: "DESC",
          label: "DESC",
          value: "DESC",
        },
      ],
    };
    expect(actual).toEqual(expected);
  });

  it("doesn't return empty values", () => {
    const url = "?emails=,,test@appsmith.com&events=,,page.created";
    const actual = urlToSearchFilters(url);
    const expected = {
      emails: [
        {
          id: "test@appsmith.com",
          label: "test@appsmith.com",
          value: "test@appsmith.com",
        },
      ],
      events: [
        {
          id: "page.created",
          label: "Page created",
          value: "page.created",
        },
      ],
    };
    expect(actual).toEqual(expected);
  });
});
