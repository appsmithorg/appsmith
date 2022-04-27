import {
  convertValueToISO,
  DateFieldProps,
  defaultValueModifier,
} from "./DateField";

describe(".convertValueToISO", () => {
  it("converts valid date to ISO", () => {
    const inputs = [
      {
        value: "2022-04-26 14:58",
        dateFormat: "YYYY-MM-DD HH:mm",
        expectedOutput: "2022-04-26T14:58:00.000+05:30",
      },
      {
        value: "2022-04-26T14:58:28",
        dateFormat: "YYYY-MM-DDTHH:mm:ss",
        expectedOutput: "2022-04-26T14:58:28.2828+05:30",
      },
      {
        value: "14:58 PM 26 April, 2022",
        dateFormat: "H:mm A D MMMM, YYYY",
        expectedOutput: "2022-04-26T14:58:00.000+05:30",
      },
      {
        value: "26/04/2022",
        dateFormat: "DD/MM/YYYY",
        expectedOutput: "2022-04-26T00:00:00.000+05:30",
      },
    ];

    inputs.forEach((input) => {
      const result = convertValueToISO(input.value, input.dateFormat);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("returns value if already in ISO format", () => {
    const inputs = [
      {
        value: "2022-04-26T14:58:28.2828+05:30",
        dateFormat: "YYYY-MM-DD HH:mm",
        expectedOutput: "2022-04-26T14:58:28.2828+05:30",
      },
      {
        value: "2022-04-26T14:58:28.2828+05:30",
        dateFormat: "DD/MM/YYYY",
        expectedOutput: "2022-04-26T14:58:28.2828+05:30",
      },
    ];

    inputs.forEach((input) => {
      const result = convertValueToISO(input.value, input.dateFormat);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("returns value when invalid date", () => {
    const inputs = [
      {
        value: "2022-04",
        dateFormat: "YYYY-MM-DD HH:mm",
        expectedOutput: "2022-04",
      },
      {
        value: "2022-44-26",
        dateFormat: "DD/MM/YYYY",
        expectedOutput: "2022-44-26",
      },
    ];

    inputs.forEach((input) => {
      const result = convertValueToISO(input.value, input.dateFormat);
      expect(result).toEqual(input.expectedOutput);
    });
  });
});

describe(".defaultValueModifier", () => {
  it("returns ISO when convertToISO is true and input is non ISO", () => {
    const schemaItem = ({
      dateFormat: "YYYY-MM-DD HH:mm",
      convertToISO: true,
    } as unknown) as DateFieldProps["schemaItem"];

    const input = "2022-04-26 14:58";
    const expectedOutput = "2022-04-26T14:58:00.000+05:30";

    const response = defaultValueModifier(schemaItem, input);

    expect(response).toEqual(expectedOutput);
  });

  it("returns ISO when convertToISO is true and input is ISO", () => {
    const schemaItem = ({
      dateFormat: "YYYY-MM-DD HH:mm",
      convertToISO: true,
    } as unknown) as DateFieldProps["schemaItem"];

    const input = "2022-04-26T14:58:00.000+05:30";
    const expectedOutput = "2022-04-26T14:58:00.000+05:30";

    const response = defaultValueModifier(schemaItem, input);

    expect(response).toEqual(expectedOutput);
  });

  it("returns non ISO when convertToISO is false and input is non ISO", () => {
    const schemaItem = ({
      dateFormat: "YYYY-MM-DD HH:mm",
      convertToISO: false,
    } as unknown) as DateFieldProps["schemaItem"];

    const input = "2022-04-26 14:58";
    const expectedOutput = "2022-04-26 14:58";

    const response = defaultValueModifier(schemaItem, input);

    expect(response).toEqual(expectedOutput);
  });

  it("returns non ISO when convertToISO is false and input is ISO", () => {
    const schemaItem = ({
      dateFormat: "YYYY-MM-DD HH:mm",
      convertToISO: false,
    } as unknown) as DateFieldProps["schemaItem"];

    const input = "2022-04-26T14:58:00.000+05:30";
    const expectedOutput = "2022-04-26 14:58";

    const response = defaultValueModifier(schemaItem, input);

    expect(response).toEqual(expectedOutput);
  });

  it("returns echos value when invalid", () => {
    const schemaItem = ({
      dateFormat: "YYYY-MM-DD HH:mm",
      convertToISO: false,
    } as unknown) as DateFieldProps["schemaItem"];

    const expectedInputAndOutput = [
      { input: "", expectedOutput: "" },
      { input: "2011-22-02 10:20", expectedOutput: "2011-22-02 10:20" },
    ];

    expectedInputAndOutput.forEach(({ expectedOutput, input }) => {
      const response = defaultValueModifier(schemaItem, input);

      expect(response).toEqual(expectedOutput);
    });
  });
});
