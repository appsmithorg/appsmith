// eslint-disable-next-line
// @ts-nocheck
import { defaultSelectedValuesValidation } from "./";

describe("<CheckboxGroup />", () => {
  test("should return empty parsed array on null options", async () => {
    const result = defaultSelectedValuesValidation("", {
      options: null,
    });

    expect(result).toStrictEqual({ isValid: true, parsed: [] });
  });

  test("should return parsed array on valid single default option as string", async () => {
    const result = defaultSelectedValuesValidation("blue", {
      options: [
        {
          label: "blue",
          value: "blue",
        },
        {
          label: "green",
          value: "green",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: ["blue"] });
  });

  test("should return parsed array on multiple default options as string ", async () => {
    const result = defaultSelectedValuesValidation("blue,green", {
      options: [
        {
          label: "blue",
          value: "blue",
        },
        {
          label: "green",
          value: "green",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: ["blue", "green"] });
  });

  test("should return parsed array on multiple default options as array ", async () => {
    const result = defaultSelectedValuesValidation(`["blue"]`, {
      options: [
        {
          label: "blue",
          value: "blue",
        },
        {
          label: "green",
          value: "green",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: ["blue"] });
  });
});
