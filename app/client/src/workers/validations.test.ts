import { validate, WIDGET_TYPE_VALIDATION_ERROR } from "workers/validations";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: WidgetTypes.SKELETON_WIDGET,
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
    const inputs = ["abc", "xyz", undefined, null, {}, [], 123];
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "string"`,
      },
      {
        isValid: false,
        parsed: "abc",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "string"`,
      },
      {
        isValid: false,
        parsed: "abc",
        message: `Value is not allowed`,
      },
      {
        isValid: false,
        parsed: "abc",
        message: `Value is not allowed`,
      },
      {
        isValid: true,
        parsed: "123",
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: base64 string or data uri or URL`,
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates number", () => {
    const config = {
      type: ValidationTypes.NUMBER,
      params: {
        required: true,
        min: 100,
        max: 200,
        default: 150,
      },
    };
    const inputs = [120, 90, 220, undefined, {}, [], "120"];
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
      },
      {
        isValid: false,
        parsed: 150,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
      },
      {
        isValid: true,
        parsed: 120,
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("correctly validates boolean", () => {
    const config = {
      type: ValidationTypes.BOOLEAN,
      params: {
        default: false,
        required: true,
      },
    };
    const inputs = ["123", undefined, false, true, [], {}, "true", "false"];
    const expected = [
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
        parsed: false,
      },
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
        parsed: false,
      },
      {
        isValid: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `Value of key: key1 is invalid: This value does not evaluate to type \"number\"`,
      },
      {
        isValid: false,
        parsed: { key1: 120, key2: "abc" },
        message: `Value of key: key2 is invalid: Value is not allowed`,
      },
    ];
    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});
