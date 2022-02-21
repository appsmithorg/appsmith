import { validate, WIDGET_TYPE_VALIDATION_ERROR } from "workers/validations";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import moment from "moment";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("Validate Validators", () => {
  it("correctly validates text", () => {
    const validation = {
      type: ValidationTypes.TEXT,
      params: {
        required: true,
        default: "abc",
        allowedValues: ["abc", "123", "mno", "test"],
      },
    };
    const inputs = ["abc", "xyz", undefined, null, {}, [], 123, ""];
    const expected = [
      {
        isValid: true,
        parsed: "abc",
      },
      {
        isValid: false,
        parsed: "abc",
        messages: ["Disallowed value: xyz"],
      },
      {
        isValid: false,
        parsed: "abc",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
        ],
      },
      {
        isValid: false,
        parsed: "abc",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
        ],
      },
      {
        isValid: false,
        parsed: "{}",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
        ],
      },
      {
        isValid: false,
        parsed: "[]",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
        ],
      },
      {
        isValid: true,
        parsed: "123",
      },
      {
        isValid: false,
        parsed: "abc",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
        ],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(validation, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates text with regex match", () => {
    const validation = {
      type: ValidationTypes.TEXT,
      params: {
        default: "https://www.appsmith.com",
        regex: /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/,
      },
    };
    const inputs = [
      "",
      undefined,
      "https://www.appsmith.com/",
      "www.google.com",
      "app.appsmith.com",
    ];
    const expected = [
      {
        isValid: true,
        parsed: "https://www.appsmith.com",
      },
      {
        isValid: true,
        parsed: "https://www.appsmith.com",
      },
      {
        isValid: true,
        parsed: "https://www.appsmith.com/",
      },

      {
        isValid: true,
        parsed: "www.google.com",
      },
      {
        isValid: true,
        parsed: "app.appsmith.com",
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(validation, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });
  it("correctly uses the expected message", () => {
    const validation = {
      type: ValidationTypes.TEXT,
      params: {
        default: "https://www.appsmith.com",
        regex: /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/,
        expected: {
          type: "URL",
          example: "https://www.appsmith.com",
          autocompleteDataType: AutocompleteDataType.STRING,
        },
      },
    };
    const inputs = [
      "",
      undefined,
      "https://www.appsmith.com/",
      "www.google.com",
      "app.appsmith.com",
    ];
    const expected = [
      {
        isValid: true,
        parsed: "https://www.appsmith.com",
      },
      {
        isValid: true,
        parsed: "https://www.appsmith.com",
      },
      {
        isValid: true,
        parsed: "https://www.appsmith.com/",
      },

      {
        isValid: true,
        parsed: "www.google.com",
      },
      {
        isValid: true,
        parsed: "app.appsmith.com",
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(validation, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates text when required is set to false", () => {
    const validation = {
      type: ValidationTypes.TEXT,
      params: {
        default: "abc",
        allowedValues: ["abc", "123", "mno", "test"],
      },
    };
    const inputs = [""];
    const expected = [
      {
        isValid: true,
        parsed: "abc",
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(validation, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates strict text", () => {
    const validation = {
      type: ValidationTypes.TEXT,
      params: {
        required: true,
        default: "abc",
        allowedValues: ["abc", "123", "mno", "test"],
        strict: true,
      },
    };
    const inputs = ["abc", "xyz", 123];
    const expected = [
      {
        isValid: true,
        parsed: "abc",
      },
      {
        isValid: false,
        parsed: "abc",
        messages: ["Disallowed value: xyz"],
      },
      {
        isValid: false,
        parsed: "abc",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
        ],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(validation, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates image url", () => {
    const config = {
      type: ValidationTypes.IMAGE_URL,
      params: {
        default:
          "https://cdn.dribbble.com/users/1787323/screenshots/4563995/dribbbe_hammer-01.png",
        required: true,
      },
    };

    const inputs = [
      "https://cdn.dribbble.com/users/1787323/screenshots/4563995/dribbbe_hammer-01.png",
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQUGCP/EACAQAAICAgICAwAAAAAAAAAAAAECAwUEEQAhBkESFSL/xAAVAQEBAAAAAAAAAAAAAAAAAAAFBv/EABwRAQAABwEAAAAAAAAAAAAAAAEAAgMEBREhQf/aAAwDAQACEQMRAD8A0nU5V9i+Q5/3NREaEpElc+NjGaVm1+iwQEhfe2A0ffIC5trSK3zYo8+dETIdVUMdABjocF9Z2UV1lRRWGXHGsxVVWZgAO+gN8WMSzFmPyYnZJ7JPAchcNQA5qKvEWktFmme7DyP/2Q==",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQUGCP/EACAQAAICAgICAwAAAAAAAAAAAAECAwUEEQAhBkESFSL/xAAVAQEBAAAAAAAAAAAAAAAAAAAFBv/EABwRAQAABwEAAAAAAAAAAAAAAAEAAgMEBREhQf/aAAwDAQACEQMRAD8A0nU5V9i+Q5/3NREaEpElc+NjGaVm1+iwQEhfe2A0ffIC5trSK3zYo8+dETIdVUMdABjocF9Z2UV1lRRWGXHGsxVVWZgAO+gN8WMSzFmPyYnZJ7JPAchcNQA5qKvEWktFmme7DyP/2Q==",
      undefined,
    ];

    const expected = [
      {
        isValid: true,
        parsed:
          "https://cdn.dribbble.com/users/1787323/screenshots/4563995/dribbbe_hammer-01.png",
      },
      {
        isValid: true,
        parsed:
          "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQUGCP/EACAQAAICAgICAwAAAAAAAAAAAAECAwUEEQAhBkESFSL/xAAVAQEBAAAAAAAAAAAAAAAAAAAFBv/EABwRAQAABwEAAAAAAAAAAAAAAAEAAgMEBREhQf/aAAwDAQACEQMRAD8A0nU5V9i+Q5/3NREaEpElc+NjGaVm1+iwQEhfe2A0ffIC5trSK3zYo8+dETIdVUMdABjocF9Z2UV1lRRWGXHGsxVVWZgAO+gN8WMSzFmPyYnZJ7JPAchcNQA5qKvEWktFmme7DyP/2Q==",
      },
      {
        isValid: true,
        parsed:
          "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQUGCP/EACAQAAICAgICAwAAAAAAAAAAAAECAwUEEQAhBkESFSL/xAAVAQEBAAAAAAAAAAAAAAAAAAAFBv/EABwRAQAABwEAAAAAAAAAAAAAAAEAAgMEBREhQf/aAAwDAQACEQMRAD8A0nU5V9i+Q5/3NREaEpElc+NjGaVm1+iwQEhfe2A0ffIC5trSK3zYo8+dETIdVUMdABjocF9Z2UV1lRRWGXHGsxVVWZgAO+gN8WMSzFmPyYnZJ7JPAchcNQA5qKvEWktFmme7DyP/2Q==",
      },
      {
        isValid: false,
        parsed:
          "https://cdn.dribbble.com/users/1787323/screenshots/4563995/dribbbe_hammer-01.png",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR}: base64 encoded image | data uri | image url`,
        ],
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates number when required is true", () => {
    const config = {
      type: ValidationTypes.NUMBER,
      params: {
        required: true,
        min: 100,
        max: 200,
        default: 150,
      },
    };
    const inputs = [120, 90, 220, undefined, {}, [], "120", ""];
    const expected = [
      {
        isValid: true,
        parsed: 120,
      },
      {
        isValid: false,
        parsed: 90,
        messages: ["Minimum allowed value: 100"],
      },
      {
        isValid: false,
        parsed: 200,
        messages: ["Maximum allowed value: 200"],
      },
      {
        isValid: false,
        parsed: 150,
        messages: ["This value is required"],
      },
      {
        isValid: false,
        parsed: 150,
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} number Min: 100 Max: 200 Required`,
        ],
      },
      {
        isValid: false,
        parsed: 150,
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} number Min: 100 Max: 200 Required`,
        ],
      },
      {
        isValid: true,
        parsed: 120,
      },
      {
        isValid: false,
        parsed: 150,
        messages: ["This value is required"],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates number when required is false", () => {
    const config = {
      type: ValidationTypes.NUMBER,
      params: {
        min: -8,
        max: 200,
        default: 150,
      },
    };
    const inputs = ["", "-120", "-8"];
    const expected = [
      {
        isValid: true,
        parsed: 150,
      },
      {
        isValid: false,
        parsed: -120,
        messages: ["Minimum allowed value: -8"],
      },
      {
        isValid: true,
        parsed: -8,
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates boolean when required is true", () => {
    const config = {
      type: ValidationTypes.BOOLEAN,
      params: {
        default: false,
        required: true,
      },
    };
    const inputs = ["123", undefined, false, true, [], {}, "true", "false", ""];
    const expected = [
      {
        isValid: false,
        messages: [`${WIDGET_TYPE_VALIDATION_ERROR} boolean`],
        parsed: false,
      },
      {
        isValid: false,
        messages: [`${WIDGET_TYPE_VALIDATION_ERROR} boolean`],
        parsed: false,
      },
      {
        isValid: true,
        parsed: false,
      },
      {
        isValid: true,
        parsed: true,
      },
      {
        isValid: false,
        messages: [`${WIDGET_TYPE_VALIDATION_ERROR} boolean`],
        parsed: false,
      },
      {
        isValid: false,
        messages: [`${WIDGET_TYPE_VALIDATION_ERROR} boolean`],
        parsed: false,
      },
      {
        isValid: true,
        parsed: true,
      },
      {
        isValid: true,
        parsed: false,
      },
      {
        isValid: false,
        parsed: false,
        messages: ["This value does not evaluate to type boolean"],
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates boolean when required is false", () => {
    const config = {
      type: ValidationTypes.BOOLEAN,
      params: {
        default: false,
      },
    };
    const inputs = [""];
    const expected = [
      {
        isValid: true,
        parsed: false,
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates object", () => {
    const config = {
      type: ValidationTypes.OBJECT,
      params: {
        required: true,
        default: { key1: 120, key2: "abc" },
        allowedKeys: [
          {
            name: "key1",
            type: ValidationTypes.NUMBER,
            params: {
              required: true,
              default: 120,
            },
          },
          {
            name: "key2",
            type: ValidationTypes.TEXT,
            params: {
              default: "abc",
              allowedValues: ["abc", "mnop"],
            },
          },
        ],
      },
    };
    const inputs = [
      { key1: 100, key2: "mnop" },
      `{ "key1": 100, "key2": "mnop" }`,
      { key3: "abc", key1: 30 },
      undefined,
      [],
      { key1: [], key2: "abc" },
      { key1: 120, key2: {} },
      { key2: "abc", key3: "something" },
    ];

    const expected = [
      {
        isValid: true,
        parsed: { key1: 100, key2: "mnop" },
      },
      {
        isValid: true,
        parsed: { key1: 100, key2: "mnop" },
      },
      {
        isValid: true,
        parsed: { key1: 30, key3: "abc" },
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR}: { \"key1\": \"number Required\", \"key2\": \"string ( abc | mnop )\" }`,
        ],
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR}: { \"key1\": \"number Required\", \"key2\": \"string ( abc | mnop )\" }`,
        ],
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        messages: [
          `Value of key: key1 is invalid: This value does not evaluate to type number Required`,
        ],
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        messages: [
          `Value of key: key2 is invalid: This value does not evaluate to type string ( abc | mnop )`,
        ],
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        messages: [`Missing required key: key1`],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates array with allowed values", () => {
    const inputs = [
      ["a", "b", "c"],
      ["m", "n", "b"],
      ["p", "r", "q"],
      ["p", "r", "q", "s"],
      [],
      {},
    ];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        allowedValues: ["a", "b", "c", "n", "m", "p", "r"],
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: ["a", "b", "c"],
        messages: [],
      },
      {
        isValid: true,
        parsed: ["m", "n", "b"],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: ["Value is not allowed in this array: q"],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "Value is not allowed in this array: q",
          "Value is not allowed in this array: s",
        ],
      },
      {
        isValid: true,
        parsed: [],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This value does not evaluate to type Array<'a' | 'b' | 'c' | 'n' | 'm' | 'p' | 'r'>",
        ],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates array with allowed values and default value", () => {
    const inputs = [
      ["a", "b", "c"],
      ["m", "n", "b"],
      ["p", "r", "q"],
      ["p", "r", "q", "s"],
      [],
      {},
    ];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        allowedValues: ["a", "b", "c", "n", "m", "p", "r"],
        default: ["a"],
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: ["a", "b", "c"],
        messages: [],
      },
      {
        isValid: true,
        parsed: ["m", "n", "b"],
        messages: [],
      },
      {
        isValid: false,
        parsed: ["a"],
        messages: ["Value is not allowed in this array: q"],
      },
      {
        isValid: false,
        parsed: ["a"],
        messages: [
          "Value is not allowed in this array: q",
          "Value is not allowed in this array: s",
        ],
      },
      {
        isValid: true,
        parsed: [],
        messages: [],
      },
      {
        isValid: false,
        parsed: ["a"],
        messages: [
          "This value does not evaluate to type Array<'a' | 'b' | 'c' | 'n' | 'm' | 'p' | 'r'>",
        ],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly limits the number of validation errors in array validation", () => {
    const input = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
    ];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        children: {
          type: ValidationTypes.NUMBER,
          params: {
            required: true,
            allowedValues: [1, 2, 3, 4],
          },
        },
      },
    };
    const expected = {
      isValid: false,
      parsed: [],
      messages: [
        "Invalid entry at index: 0. This value does not evaluate to type number Required",
        "Invalid entry at index: 1. This value does not evaluate to type number Required",
        "Invalid entry at index: 2. This value does not evaluate to type number Required",
        "Invalid entry at index: 3. This value does not evaluate to type number Required",
        "Invalid entry at index: 4. This value does not evaluate to type number Required",
        "Invalid entry at index: 5. This value does not evaluate to type number Required",
        "Invalid entry at index: 6. This value does not evaluate to type number Required",
        "Invalid entry at index: 7. This value does not evaluate to type number Required",
        "Invalid entry at index: 8. This value does not evaluate to type number Required",
        "Invalid entry at index: 9. This value does not evaluate to type number Required",
      ],
    };

    const result = validate(config, input, DUMMY_WIDGET);
    expect(result).toStrictEqual(expected);
  });

  it("correctly validates array when required is true", () => {
    const inputs = [
      ["a", "b", "c"],
      ["m", "n", "b"],
      ["p", "r", "q"],
      [],
      {},
      undefined,
      null,
      "ABC",
      `["a", "b", "c"]`,
      '{ "key": "value" }',
      ["a", "b", "a", "c"],
      "",
      "[]",
    ];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        required: true,
        unique: true,
        children: {
          type: ValidationTypes.TEXT,
          params: {
            required: true,
            allowedValues: ["a", "b", "c", "n", "m", "p", "r"],
          },
        },
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: ["a", "b", "c"],
        messages: [],
      },
      {
        isValid: true,
        parsed: ["m", "n", "b"],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: ["Invalid entry at index: 2. Disallowed value: q"],
      },
      {
        isValid: true,
        parsed: [],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This value does not evaluate to type Array<string ( a | b | c | n | m | p | r )>",
        ],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This property is required for the widget to function correctly",
        ],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This property is required for the widget to function correctly",
        ],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This value does not evaluate to type Array<string ( a | b | c | n | m | p | r )>",
        ],
      },
      {
        isValid: true,
        parsed: ["a", "b", "c"],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This value does not evaluate to type Array<string ( a | b | c | n | m | p | r )>",
        ],
      },
      {
        isValid: false,
        parsed: [],
        messages: ["Array must be unique. Duplicate values found at index: 2"],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This property is required for the widget to function correctly",
        ],
      },
      {
        isValid: true,
        parsed: [],
        messages: [],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates array when required is false", () => {
    const inputs = [""];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        unique: true,
        children: {
          type: ValidationTypes.TEXT,
          params: {
            required: true,
            allowedValues: ["a", "b", "c", "n", "m", "p", "r"],
          },
        },
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: [],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates array with specific object children and required is true", () => {
    const inputs = [
      [{ label: 123, value: 234 }],
      `[{"label": 123, "value": 234}]`,
      [{ labels: 123, value: 234 }],
      [{ label: "abcd", value: 234 }],
      [{}],
      [],
      "",
    ];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        required: true,
        children: {
          type: ValidationTypes.OBJECT,
          params: {
            allowedKeys: [
              {
                name: "label",
                type: ValidationTypes.NUMBER,
                params: {
                  required: true,
                },
              },
              {
                name: "value",
                type: ValidationTypes.NUMBER,
                params: {
                  required: true,
                },
              },
            ],
          },
        },
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: [{ label: 123, value: 234 }],
        messages: [],
      },
      {
        isValid: true,
        parsed: [{ label: 123, value: 234 }],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: ["Invalid entry at index: 0. Missing required key: label"],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          `Invalid entry at index: 0. Value of key: label is invalid: This value does not evaluate to type number Required`,
        ],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "Invalid entry at index: 0. Missing required key: label",
          "Invalid entry at index: 0. Missing required key: value",
        ],
      },
      {
        isValid: true,
        parsed: [],
        messages: [],
      },
      {
        isValid: false,
        parsed: [],
        messages: [
          "This property is required for the widget to function correctly",
        ],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates array with specific object children and required is false", () => {
    const inputs = [""];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        children: {
          type: ValidationTypes.OBJECT,
          params: {
            allowedKeys: [
              {
                name: "label",
                type: ValidationTypes.NUMBER,
                params: {
                  required: true,
                },
              },
              {
                name: "value",
                type: ValidationTypes.NUMBER,
                params: {
                  required: true,
                },
              },
            ],
          },
        },
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: [],
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates date iso string when required is true", () => {
    const defaultLocalDate = moment().toISOString(true);
    const defaultDate = moment().toISOString();
    const inputs = [
      defaultDate,
      defaultLocalDate,
      "2021-08-08",
      undefined,
      null,
      "",
    ];

    const config = {
      type: ValidationTypes.DATE_ISO_STRING,
      params: {
        required: true,
        default: defaultDate,
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: defaultDate,
      },
      {
        isValid: true,
        parsed: defaultLocalDate,
      },
      {
        isValid: true,
        parsed: moment("2021-08-08").toISOString(true),
      },
      {
        isValid: false,
        parsed: defaultDate,
        messages: ["Value does not match: ISO 8601 date string"],
      },
      {
        isValid: false,
        parsed: defaultDate,
        messages: ["Value does not match: ISO 8601 date string"],
      },
      {
        isValid: false,
        messages: ["Value does not match: ISO 8601 date string"],
        parsed: defaultDate,
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates date iso string when required is false", () => {
    const defaultDate = moment().toISOString();
    const inputs = [""];

    const config = {
      type: ValidationTypes.DATE_ISO_STRING,
      params: {
        required: false,
        default: "",
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: "",
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
      expect(result).not.toStrictEqual(defaultDate);
    });
  });

  it("correctly validates object array when required is true", () => {
    const inputs = [
      [
        { apple: 1 },
        { orange: 2, mango: "fruit", watermelon: false },
        { banana: 3 },
      ],
      `[{ "apple": 1, "orange": 2, "mango": "fruit", "watermelon": false }]`,
      {},
      undefined,
      null,
      [],
      123,
      "abcd",
      [null],
      [{ apple: 1 }, null, { banana: "2" }, undefined],
      `[{ "apple": 1, "orange": 2, "mango": "fruit", "watermelon": false }, null]`,
      "",
    ];

    const config = {
      type: ValidationTypes.OBJECT_ARRAY,
      params: {
        required: true,
        default: [{ id: 1, name: "alpha" }],
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: [
          { apple: 1 },
          { orange: 2, mango: "fruit", watermelon: false },
          { banana: 3 },
        ],
      },
      {
        isValid: true,
        parsed: [{ apple: 1, orange: 2, mango: "fruit", watermelon: false }],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["Invalid object at index 0"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["Invalid object at index 1"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["Invalid object at index 1"],
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        messages: ["This value does not evaluate to type Array<Object>"],
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates object array when required is false", () => {
    const inputs = [""];

    const config = {
      type: ValidationTypes.OBJECT_ARRAY,
      params: {
        required: false,
        default: [{ id: 1, name: "alpha" }],
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: [{ id: 1, name: "alpha" }],
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates object array when required is false", () => {
    const inputs = [[]];

    const config = {
      type: ValidationTypes.OBJECT_ARRAY,
      params: {
        required: false,
        default: [{ id: 1, name: "alpha" }],
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: [{ id: 1, name: "alpha" }],
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates safe URL", () => {
    const config = {
      type: ValidationTypes.SAFE_URL,
      params: {
        default: "https://www.example.com",
      },
    };
    const inputs = [
      "https://www.example.com",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
      "javascript:alert(document.cookie)",
      "data:text/html,<svg onload=alert(1)>",
    ];
    const expected = [
      {
        isValid: true,
        parsed: "https://www.example.com",
      },
      {
        isValid: true,
        parsed:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
      },
      {
        isValid: false,
        messages: [`${WIDGET_TYPE_VALIDATION_ERROR}: URL`],
        parsed: "https://www.example.com",
      },
      {
        isValid: false,
        messages: [`${WIDGET_TYPE_VALIDATION_ERROR}: URL`],
        parsed: "https://www.example.com",
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });
  it("correctly validates array when default is given", () => {
    const inputs = [undefined, null, ""];
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        required: true,
        unique: true,
        default: [],
      },
    };
    const expected = {
      isValid: true,
      parsed: [],
    };
    inputs.forEach((input) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected);
    });
  });

  it("correctly validates uniqueness of keys in array objects", () => {
    const config = {
      type: ValidationTypes.ARRAY,
      params: {
        children: {
          type: ValidationTypes.OBJECT,
          params: {
            allowedKeys: [
              {
                name: "label",
                type: ValidationTypes.TEXT,
                params: {
                  default: "",
                  required: true,
                  unique: true,
                },
              },
              {
                name: "value",
                type: ValidationTypes.TEXT,
                params: {
                  default: "",
                  unique: true,
                },
              },
            ],
          },
        },
      },
    };
    const input = [
      { label: "Blue", value: "" },
      { label: "Green", value: "" },
      { label: "Red", value: "red" },
    ];
    const expected = {
      isValid: false,
      parsed: [],
      messages: [
        "Duplicate values found for the following properties, in the array entries, that must be unique -- label,value.",
      ],
    };

    const result = validate(config, input, DUMMY_WIDGET);
    expect(result).toStrictEqual(expected);
  });

  it("correctly validates TableProperty", () => {
    const inputs = [
      "a",
      ["a", "b"],
      "x",
      ["a", "b", "x"],
      ["a", "b", "x", "y"],
    ];
    const config = {
      type: ValidationTypes.TABLE_PROPERTY,
      params: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: ["a", "b", "c"],
          default: "a",
        },
      },
    };
    const expected = [
      {
        isValid: true,
        parsed: "a",
      },
      {
        isValid: true,
        parsed: ["a", "b"],
      },
      {
        isValid: false,
        parsed: "a",
        messages: ["Disallowed value: x"],
      },
      {
        isValid: false,
        parsed: "a",
        messages: ["Disallowed value: x"],
      },
      {
        isValid: false,
        parsed: "a",
        messages: ["Disallowed value: x"],
      },
    ];
    inputs.forEach((input, i) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[i]);
    });
  });
});

// describe("Color Picker Text validator", () => {
//   const validator = VALIDATORS.COLOR_PICKER_TEXT;
//   const inputs = [
//     "#e0e0e0",
//     "rgb(200,200,200)",
//     "{{Text2.text}}",
//     "<p>red</p>",
//   ];
//   const expected = [
//     {
//       isValid: true,
//       parsed: "#e0e0e0",
//     },
//     {
//       isValid: true,
//       parsed: "rgb(200,200,200)",
//     },
//     {
//       isValid: false,
//       parsed: "",
//       message: "This value does not evaluate to type: text",
//     },
//     {
//       isValid: false,
//       parsed: "",
//       message: "This value does not evaluate to type: text",
//     },
//   ];
//   inputs.forEach((input, index) => {
//     const response = validator(input, DUMMY_WIDGET);
//     expect(response).toStrictEqual(expected[index]);
//   });
// });
