import { validate, WIDGET_TYPE_VALIDATION_ERROR } from "workers/validations";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import moment from "moment";

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
        message: "Value is not allowed",
      },
      {
        isValid: false,
        parsed: "abc",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
      },
      {
        isValid: false,
        parsed: "abc",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
      },
      {
        isValid: false,
        parsed: "{}",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
      },
      {
        isValid: false,
        parsed: "[]",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
      },
      {
        isValid: true,
        parsed: "123",
      },
      {
        isValid: true,
        parsed: "",
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
        parsed: "",
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
        message: "Value is not allowed",
      },
      {
        isValid: false,
        parsed: "abc",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} string ( abc | 123 | mno | test )`,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: base64 encoded image | data uri | image url`,
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
        message: "Minimum allowed value: 100",
      },
      {
        isValid: false,
        parsed: 220,
        message: "Maximum allowed value: 200",
      },
      {
        isValid: false,
        parsed: 150,
        message: "This value is required",
      },
      {
        isValid: false,
        parsed: 150,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} number Min: 100 Max: 200 Required`,
      },
      {
        isValid: false,
        parsed: 150,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} number Min: 100 Max: 200 Required`,
      },
      {
        isValid: true,
        parsed: 120,
      },
      {
        isValid: false,
        parsed: 150,
        message: "This value is required",
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
        min: 100,
        max: 200,
        default: 150,
      },
    };
    const inputs = [""];
    const expected = [
      {
        isValid: true,
        parsed: 150,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR} boolean`,
        parsed: false,
      },
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} boolean`,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR} boolean`,
        parsed: false,
      },
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} boolean`,
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
        message: "This value does not evaluate to type boolean",
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: { \"key1\": \"number Required\", \"key2\": \"string ( abc | mnop )\" }`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: { \"key1\": \"number Required\", \"key2\": \"string ( abc | mnop )\" }`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `Value of key: key1 is invalid: This value does not evaluate to type number Required`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `Value of key: key2 is invalid: This value does not evaluate to type string ( abc | mnop )`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `Missing required key: key1`,
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
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
        message: "",
      },
      {
        isValid: true,
        parsed: ["m", "n", "b"],
        message: "",
      },
      {
        isValid: false,
        parsed: [],
        message: "Invalid entry at index: 2. Value is not allowed",
      },
      {
        isValid: true,
        parsed: [],
        message: "",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This value does not evaluate to type Array<string ( a | b | c | n | m | p | r )>",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This property is required for the widget to function correctly",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This property is required for the widget to function correctly",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This value does not evaluate to type Array<string ( a | b | c | n | m | p | r )>",
      },
      {
        isValid: true,
        parsed: ["a", "b", "c"],
        message: "",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This value does not evaluate to type Array<string ( a | b | c | n | m | p | r )>",
      },
      {
        isValid: false,
        parsed: [],
        message: "Array must be unique. Duplicate values found",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This property is required for the widget to function correctly",
      },
      {
        isValid: true,
        parsed: [],
        message: "",
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
        message: "",
      },
      {
        isValid: true,
        parsed: [{ label: 123, value: 234 }],
        message: "",
      },
      {
        isValid: false,
        parsed: [],
        message: "Invalid entry at index: 0. Missing required key: label",
      },
      {
        isValid: false,
        parsed: [],
        message: `Invalid entry at index: 0. Value of key: label is invalid: This value does not evaluate to type number Required`,
      },
      {
        isValid: false,
        parsed: [],
        message:
          "Invalid entry at index: 0. Missing required key: label Missing required key: value",
      },
      {
        isValid: true,
        parsed: [],
        message: "",
      },
      {
        isValid: false,
        parsed: [],
        message:
          "This property is required for the widget to function correctly",
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
        message: "Value does not match: ISO 8601 date string",
      },
      {
        isValid: false,
        parsed: defaultDate,
        message: "Value does not match: ISO 8601 date string",
      },
      {
        isValid: false,
        message: "Value does not match: ISO 8601 date string",
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
        default: defaultDate,
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: defaultDate,
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
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
        message: "This value does not evaluate to type Array<Object>",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "This value does not evaluate to type Array<Object>",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "This value does not evaluate to type Array<Object>",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "This value does not evaluate to type Array<Object>",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "This value does not evaluate to type Array<Object>",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "This value does not evaluate to type Array<Object>",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "Invalid object at index 0",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "Invalid object at index 1",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "Invalid object at index 1",
      },
      {
        isValid: false,
        parsed: [{ id: 1, name: "alpha" }],
        message: "This value does not evaluate to type Array<Object>",
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
        default: "https://wikipedia.org",
      },
    };
    const inputs = [
      "https://wikipedia.org",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
      "javascript:alert(document.cookie)",
      "data:text/html,<svg onload=alert(1)>",
    ];
    const expected = [
      {
        isValid: true,
        parsed: "https://wikipedia.org",
      },
      {
        isValid: true,
        parsed:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
      },
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: URL`,
        parsed: "https://wikipedia.org",
      },
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: URL`,
        parsed: "https://wikipedia.org",
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
