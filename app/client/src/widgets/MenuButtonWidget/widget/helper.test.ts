import { getKeysFromSourceDataForEventAutocomplete } from "./helper";

describe("getKeysFromSourceDataForEventAutocomplete", () => {
  it("Should test with valid values - array of objects", () => {
    const mockProps = [
      {
        step: "#1",
        task: "Drop a table",
        status: "✅",
        action: "",
      },
      {
        step: "#2",
        task: "Create a query fetch_users with the Mock DB",
        status: "--",
        action: "",
      },
      {
        step: "#3",
        task: "Bind the query using => fetch_users.data",
        status: "--",
        action: "",
      },
    ];

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = {
      currentItem: {
        step: "",
        task: "",
        status: "",
        action: "",
      },
    };
    expect(result).toStrictEqual(expected);
  });

  it("Should test with valid values - array of arrays of objects", () => {
    const mockProps = [
      [
        {
          gender: "male",
          name: "#1 Victor",
          email: "victor.garrett@example.com",
          phone: "011-800-3906",
          id: "6125683T",
          nat: "IE",
        },
        {
          gender: "male",
          name: "#1 Tobias",
          email: "tobias.hansen@example.com",
          phone: "84467012",
          id: "200247-8744",
          nat: "DK",
        },
        {
          gender: "female",
          name: "#1 Jane",
          email: "jane.coleman@example.com",
          phone: "(679) 516-8766",
          id: "098-73-7712",
          nat: "US",
        },
        {
          gender: "female",
          name: "#1 Yaromira",
          email: "yaromira.manuylenko@example.com",
          phone: "(099) B82-8594",
          id: null,
          nat: "UA",
        },
        {
          gender: "male",
          name: "#1 Andre",
          email: "andre.ortiz@example.com",
          phone: "08-3115-5776",
          id: "876838842",
          nat: "AU",
        },
      ],
      [
        {
          gender: "male",
          name: "#2 Victor",
          email: "victor.garrett@example.com",
          phone: "011-800-3906",
          id: "6125683T",
          nat: "IE",
        },
        {
          gender: "male",
          name: "#2 Tobias",
          email: "tobias.hansen@example.com",
          phone: "84467012",
          id: "200247-8744",
          nat: "DK",
        },
        {
          gender: "female",
          name: "#2 Jane",
          email: "jane.coleman@example.com",
          phone: "(679) 516-8766",
          id: "098-73-7712",
          nat: "US",
        },
        {
          gender: "female",
          name: "#2 Yaromira",
          email: "yaromira.manuylenko@example.com",
          phone: "(099) B82-8594",
          id: null,
          nat: "UA",
        },
        {
          gender: "male",
          name: "#2 Andre",
          email: "andre.ortiz@example.com",
          phone: "08-3115-5776",
          id: "876838842",
          nat: "AU",
        },
      ],
      [
        {
          gender: "male",
          name: "#3 Victor",
          email: "victor.garrett@example.com",
          phone: "011-800-3906",
          id: "6125683T",
          nat: "IE",
        },
        {
          gender: "male",
          name: "#3 Tobias",
          email: "tobias.hansen@example.com",
          phone: "84467012",
          id: "200247-8744",
          nat: "DK",
        },
        {
          gender: "female",
          name: "#3 Jane",
          email: "jane.coleman@example.com",
          phone: "(679) 516-8766",
          id: "098-73-7712",
          nat: "US",
        },
        {
          gender: "female",
          name: "#3 Yaromira",
          email: "yaromira.manuylenko@example.com",
          phone: "(099) B82-8594",
          id: null,
          nat: "UA",
        },
        {
          gender: "male",
          name: "#3 Andre",
          email: "andre.ortiz@example.com",
          phone: "08-3115-5776",
          id: "876838842",
          nat: "AU",
        },
      ],
    ];

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = {
      currentItem: {
        gender: "",
        name: "",
        email: "",
        phone: "",
        id: "",
        nat: "",
      },
    };
    expect(result).toStrictEqual(expected);
  });

  it("Should test with empty sourceData", () => {
    const mockProps = {
      __evaluation__: {
        evaluatedValues: {
          sourceData: [],
        },
      },
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = { currentItem: {} };
    expect(result).toStrictEqual(expected);
  });

  it("Should test without sourceData", () => {
    const mockProps = {};

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = { currentItem: {} };
    expect(result).toStrictEqual(expected);
  });

  it("Should test with null values", () => {
    const mockProps = {
      __evaluation__: {
        evaluatedValues: {
          sourceData: [null, null, null],
        },
      },
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = { currentItem: {} };
    expect(result).toStrictEqual(expected);
  });
});
