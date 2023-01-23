import _ from "lodash";

import { primaryColumnValidation } from "./propertyConfig";
import { ListWidgetProps } from ".";

describe(".primaryColumnValidation", () => {
  it("validates uniqueness of values with valid input", () => {
    const props = ({
      listData: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
    } as unknown) as ListWidgetProps;

    const inputValue = [1, 2];

    const expectedOutput = {
      isValid: true,
      parsed: inputValue,
      messages: [""],
    };

    const output = primaryColumnValidation(inputValue, props, _);

    expect(output).toEqual(expectedOutput);
  });

  it("invalidates when input keys are not unique", () => {
    const props = ({
      listData: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
    } as unknown) as ListWidgetProps;

    const inputValue = [1, 2, 3];

    const expectedOutput = {
      isValid: false,
      parsed: [],
      messages: ["Primary keys are not unique."],
    };

    const output = primaryColumnValidation(inputValue, props, _);

    expect(output).toEqual(expectedOutput);
  });

  it("returns empty with error when JS mode enabled and input value is non-array", () => {
    const props = ({
      listData: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
      dynamicPropertyPathList: [{ key: "primaryKeys" }],
    } as unknown) as ListWidgetProps;

    const inputs = [true, "true", 0, 1, undefined, null];

    inputs.forEach((input) => {
      const output = primaryColumnValidation(input, props, _);

      expect(output).toEqual({
        isValid: false,
        parsed: undefined,
        messages: [
          "Use currentItem/currentIndex to generate primary key or composite key",
        ],
      });
    });
  });

  it("returns empty with error when JS mode disabled and input value is non-array", () => {
    const props = ({
      listData: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
    } as unknown) as ListWidgetProps;

    const inputs = [true, "true", 0, 1, undefined, null];

    inputs.forEach((input) => {
      const output = primaryColumnValidation(input, props, _);

      expect(output).toEqual({
        isValid: false,
        parsed: undefined,
        messages: ["Select valid option form the primary key list"],
      });
    });
  });

  it(" returns empty with error when JS mode enabled and input is empty", () => {
    const props = ({
      listData: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
      dynamicPropertyPathList: [{ key: "primaryKeys" }],
    } as unknown) as ListWidgetProps;

    const input: unknown = [];

    const output = primaryColumnValidation(input, props, _);

    expect(output).toEqual({
      isValid: false,
      parsed: [],
      messages: ["Primary key cannot be empty"],
    });
  });
});
