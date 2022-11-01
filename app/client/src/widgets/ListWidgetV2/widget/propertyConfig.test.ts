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

  it("invalidates when input are not unique", () => {
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

  it("returns value when input value is non-array", () => {
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

    const inputs = [
      {
        input: true,
        expectedOutput_idValid: true,
      },
      {
        input: "true",
        expectedOutput_idValid: true,
      },
      {
        input: 0,
        expectedOutput_idValid: true,
      },
      {
        input: 1,
        expectedOutput_idValid: true,
      },
      {
        input: undefined,
        expectedOutput_idValid: true,
      },
      {
        input: null,
        expectedOutput_idValid: true,
      },
    ];

    inputs.forEach(({ expectedOutput_idValid, input }) => {
      const output = primaryColumnValidation(input, props, _);

      expect(output).toEqual({
        isValid: expectedOutput_idValid,
        parsed: input,
        messages: [""],
      });
    });
  });
});
