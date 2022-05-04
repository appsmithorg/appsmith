import _ from "lodash";
import {
  defaultOptionValueValidation,
  getSelectedOption,
  SelectWidgetProps,
} from ".";

const options = [
  {
    label: "Blue",
    value: "BLUE",
  },
  {
    label: "Green",
    value: "GREEN",
  },
  {
    label: "Red",
    value: "RED",
  },
];

describe("defaultOptionValueValidation - ", () => {
  describe("serverSideFiltering is true", () => {
    it("should get tested with simple string", () => {
      const input = "";

      expect(
        defaultOptionValueValidation(
          input,
          { options, serverSideFiltering: true } as SelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: {},
        messages: [
          `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
        ],
      });
    });
    it("should get tested with number", () => {
      const testValues = [
        [
          "1",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
            ],
          },
        ],
        [
          1,
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
            ],
          },
        ],
      ];

      testValues.forEach(([input, expected]) => {
        expect(
          defaultOptionValueValidation(
            input,
            { options, serverSideFiltering: true } as SelectWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });

    it("should get tested with simple string", () => {
      const input = "Green";

      expect(
        defaultOptionValueValidation(
          input,
          { options, serverSideFiltering: true } as SelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: {},
        messages: [
          `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
        ],
      });
    });

    it("should get tested with plain object", () => {
      const input = {
        label: "Green",
        value: "GREEN",
      };

      expect(
        defaultOptionValueValidation(
          input,
          { options, serverSideFiltering: true } as SelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: {
          label: "Green",
          value: "GREEN",
        },
        messages: [""],
      });
    });
    it("should get tested with valid strings", () => {
      const testValues = [
        [
          "undefined",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
            ],
          },
        ],
        [
          "null",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
            ],
          },
        ],
        [
          "true",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data`,
            ],
          },
        ],
      ];

      testValues.forEach(([input, expected]) => {
        expect(
          defaultOptionValueValidation(
            input,
            { options, serverSideFiltering: true } as SelectWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });

    it("should get tested with invalid values", () => {
      const testValues = [
        [
          undefined,
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          null,
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          [],
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          true,
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          {
            label: "Green",
          },
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
      ];

      testValues.forEach(([input, expected]) => {
        expect(
          defaultOptionValueValidation(
            input,
            { options, serverSideFiltering: true } as SelectWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });
  });

  describe("serverSideFiltering is false", () => {
    it("should get tested with simple string", () => {
      const input = "";

      expect(
        defaultOptionValueValidation(
          input,
          { options, serverSideFiltering: false } as SelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: {},
        messages: [
          "Default value is missing in options. Please update the value.",
        ],
      });
    });
    it("should get tested with number", () => {
      const testValues = [
        [
          "1",
          {
            isValid: false,
            parsed: {},
            messages: [
              "Default value is missing in options. Please update the value.",
            ],
          },
        ],
        [
          1,
          {
            isValid: false,
            parsed: {},
            messages: [
              "Default value is missing in options. Please update the value.",
            ],
          },
        ],
      ];

      testValues.forEach(([input, expected]) => {
        expect(
          defaultOptionValueValidation(
            input,
            { options, serverSideFiltering: false } as SelectWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });

    it("should get tested with simple string", () => {
      const input = "GREEN";

      expect(
        defaultOptionValueValidation(
          input,
          { options, serverSideFiltering: false } as SelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: { label: "Green", value: "GREEN" },
        messages: [""],
      });
    });

    it("should get tested with plain object", () => {
      const input = {
        label: "Green",
        value: "GREEN",
      };

      expect(
        defaultOptionValueValidation(
          input,
          { options, serverSideFiltering: false } as SelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: {
          label: "Green",
          value: "GREEN",
        },
        messages: [""],
      });
    });
    it("should get tested with valid strings", () => {
      const testValues = [
        [
          "undefined",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please update the value.`,
            ],
          },
        ],
        [
          "null",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please update the value.`,
            ],
          },
        ],
        [
          "true",
          {
            isValid: false,
            parsed: {},
            messages: [
              `Default value is missing in options. Please update the value.`,
            ],
          },
        ],
      ];

      testValues.forEach(([input, expected]) => {
        expect(
          defaultOptionValueValidation(
            input,
            { options, serverSideFiltering: false } as SelectWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });

    it("should get tested with invalid values", () => {
      const testValues = [
        [
          undefined,
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          null,
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          [],
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          true,
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
        [
          {
            label: "Green",
          },
          {
            isValid: false,
            parsed: {},
            messages: [
              `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            ],
          },
        ],
      ];

      testValues.forEach(([input, expected]) => {
        expect(
          defaultOptionValueValidation(
            input,
            { options, serverSideFiltering: false } as SelectWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });
  });
});

describe("getSelectedOption", () => {
  describe("serverSideFiltering is true", () => {
    it("If selectedOption exists in options", () => {
      expect(
        getSelectedOption(true, { label: "Blue", value: "BLUE" }, options),
      ).toEqual({ label: "Blue", value: "BLUE" });
    });
    it("If selectedOption does not exist in options", () => {
      expect(
        getSelectedOption(
          true,
          {
            label: "Yellow",
            value: "YELLOW",
          },
          options,
        ),
      ).toEqual({
        label: "Yellow",
        value: "YELLOW",
      });
    });
  });

  describe("serverSideFiltering is false", () => {
    it("If selectedOption exists in options", () => {
      expect(
        getSelectedOption(
          false,
          {
            label: "Blue",
            value: "BLUE",
          },
          options,
        ),
      ).toEqual({
        label: "Blue",
        value: "BLUE",
      });
    });
    it("If selectedOption does not exist in options", () => {
      expect(
        getSelectedOption(
          false,
          {
            label: "Yellow",
            value: "YELLOW",
          },
          options,
        ),
      ).toEqual({});
    });
  });
});
