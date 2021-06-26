import {
  validate,
  VALIDATORS,
  WIDGET_TYPE_VALIDATION_ERROR,
} from "workers/validations";
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

  // it("correctly validates chart series data ", () => {
  //   const cases = [
  //     {
  //       input: [{ x: "Jan", y: 1000 }],
  //       output: {
  //         isValid: true,
  //         parsed: [{ x: "Jan", y: 1000 }],
  //         transformed: [{ x: "Jan", y: 1000 }],
  //       },
  //     },
  //     {
  //       input: [{ x: "Jan", y: 1000 }, { x: "Feb" }],
  //       output: {
  //         isValid: false,
  //         message:
  //           'This value does not evaluate to type: "Array<x:string, y:number>"',
  //         parsed: [],
  //         transformed: [{ x: "Jan", y: 1000 }, { x: "Feb" }],
  //       },
  //     },
  //     {
  //       input: undefined,
  //       output: {
  //         isValid: false,
  //         message:
  //           'This value does not evaluate to type: "Array<x:string, y:number>"',
  //         parsed: [],
  //         transformed: undefined,
  //       },
  //     },
  //   ];
  //   for (const testCase of cases) {
  //     const response = VALIDATORS.CHART_SERIES_DATA(
  //       testCase.input,
  //       DUMMY_WIDGET,
  //       {},
  //     );
  //     expect(response).toStrictEqual(testCase.output);
  //   }
  // });
  // it("Correctly validates image string", () => {
  //   const config = {
  //     type: ValidationTypes.IMAGE_URL,
  //   };
  //   const input =
  //     "https://cdn.dribbble.com/users/1787323/screenshots/4563995/dribbbe_hammer-01.png";
  //   const result = VALIDATORS.IMAGE_URL(config, input, DUMMY_WIDGET);
  //   const expectedResult: {
  //     isValid: boolean;
  //     parsed: string;
  //     message?: string;
  //   } = {
  //     isValid: true,
  //     parsed: input,
  //     message: "",
  //   };
  //   expect(result).toStrictEqual(expectedResult);
  // });

  // it("Correctly validates page number", () => {
  //   const input = [0, -1, undefined, null, 2, "abcd", [], ""];
  //   const expected = [1, 1, 1, 1, 2, 1, 1, 1];
  //   input.forEach((val, index) => {
  //     const result = VALIDATORS.TABLE_PAGE_NO(val, DUMMY_WIDGET, undefined);
  //     const expectedResult: {
  //       isValid: boolean;
  //       parsed: number;
  //       message?: string;
  //     } = {
  //       isValid: expected[index] !== 1,
  //       parsed: expected[index],
  //     };
  //     if (expected[index] === 1) {
  //       expectedResult.message = "";
  //     }
  //     expect(result).toStrictEqual(expectedResult);
  //   });
  // });
  //   it("Correctly validates row indices", () => {
  //     const input = [0, "-1", undefined, null, "abcd", [], "", "2, 3", "-1, 2"];
  //     const expected = [[0], [], [], [], [], [], [], [2, 3], [2]];
  //     const invalidIndices = [2, 3];
  //     input.forEach((val, index) => {
  //       const result = VALIDATORS.ROW_INDICES(
  //         val,
  //         { ...DUMMY_WIDGET, multiRowSelection: true },
  //         undefined,
  //       );
  //       const expectedResult: {
  //         isValid: boolean;
  //         parsed: number[];
  //         message?: string;
  //       } = {
  //         isValid: !invalidIndices.includes(index),
  //         parsed: expected[index],
  //       };
  //       if (invalidIndices.includes(index)) {
  //         expectedResult.message = `This value does not evaluate to type: number[]`;
  //       }
  //       expect(result).toStrictEqual(expectedResult);
  //     });
  //   });
  // });

  // describe("Chart Custom Config validator", () => {
  //   const validator = VALIDATORS.CUSTOM_FUSION_CHARTS_DATA;
  //   it("correctly validates ", () => {
  //     const cases = [
  //       {
  //         input: {
  //           type: "area2d",
  //           dataSource: {
  //             chart: {
  //               caption: "Countries With Most Oil Reserves [2017-18]",
  //               subCaption: "In MMbbl = One Million barrels",
  //               xAxisName: "Country",
  //               yAxisName: "Reserves (MMbbl)",
  //               numberSuffix: "K",
  //             },
  //             data: [
  //               {
  //                 label: "Venezuela",
  //                 value: "290",
  //               },
  //               {
  //                 label: "Saudi",
  //                 value: "260",
  //               },
  //               {
  //                 label: "Canada",
  //                 value: "180",
  //               },
  //               {
  //                 label: "Iran",
  //                 value: "140",
  //               },
  //               {
  //                 label: "Russia",
  //                 value: "115",
  //               },
  //               {
  //                 label: "UAE",
  //                 value: "100",
  //               },
  //               {
  //                 label: "US",
  //                 value: "30",
  //               },
  //               {
  //                 label: "China",
  //                 value: "30",
  //               },
  //             ],
  //           },
  //         },

  //         output: {
  //           isValid: true,
  //           parsed: {
  //             type: "area2d",
  //             dataSource: {
  //               chart: {
  //                 caption: "Countries With Most Oil Reserves [2017-18]",
  //                 subCaption: "In MMbbl = One Million barrels",
  //                 xAxisName: "Country",
  //                 yAxisName: "Reserves (MMbbl)",
  //                 numberSuffix: "K",
  //               },
  //               data: [
  //                 {
  //                   label: "Venezuela",
  //                   value: "290",
  //                 },
  //                 {
  //                   label: "Saudi",
  //                   value: "260",
  //                 },
  //                 {
  //                   label: "Canada",
  //                   value: "180",
  //                 },
  //                 {
  //                   label: "Iran",
  //                   value: "140",
  //                 },
  //                 {
  //                   label: "Russia",
  //                   value: "115",
  //                 },
  //                 {
  //                   label: "UAE",
  //                   value: "100",
  //                 },
  //                 {
  //                   label: "US",
  //                   value: "30",
  //                 },
  //                 {
  //                   label: "China",
  //                   value: "30",
  //                 },
  //               ],
  //             },
  //           },

  //           transformed: {
  //             type: "area2d",
  //             dataSource: {
  //               chart: {
  //                 caption: "Countries With Most Oil Reserves [2017-18]",
  //                 subCaption: "In MMbbl = One Million barrels",
  //                 xAxisName: "Country",
  //                 yAxisName: "Reserves (MMbbl)",
  //                 numberSuffix: "K",
  //               },
  //               data: [
  //                 {
  //                   label: "Venezuela",
  //                   value: "290",
  //                 },
  //                 {
  //                   label: "Saudi",
  //                   value: "260",
  //                 },
  //                 {
  //                   label: "Canada",
  //                   value: "180",
  //                 },
  //                 {
  //                   label: "Iran",
  //                   value: "140",
  //                 },
  //                 {
  //                   label: "Russia",
  //                   value: "115",
  //                 },
  //                 {
  //                   label: "UAE",
  //                   value: "100",
  //                 },
  //                 {
  //                   label: "US",
  //                   value: "30",
  //                 },
  //                 {
  //                   label: "China",
  //                   value: "30",
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       {
  //         input: {
  //           type: "area2d",
  //           dataSource: {
  //             data: [
  //               {
  //                 label: "Venezuela",
  //                 value: "290",
  //               },
  //               {
  //                 label: "Saudi",
  //                 value: "260",
  //               },
  //               {
  //                 label: "Canada",
  //                 value: "180",
  //               },
  //               {
  //                 label: "Iran",
  //                 value: "140",
  //               },
  //               {
  //                 label: "Russia",
  //                 value: "115",
  //               },
  //               {
  //                 label: "UAE",
  //                 value: "100",
  //               },
  //               {
  //                 label: "US",
  //                 value: "30",
  //               },
  //               {
  //                 label: "China",
  //                 value: "30",
  //               },
  //             ],
  //           },
  //         },
  //         output: {
  //           isValid: true,
  //           parsed: {
  //             type: "area2d",
  //             dataSource: {
  //               data: [
  //                 {
  //                   label: "Venezuela",
  //                   value: "290",
  //                 },
  //                 {
  //                   label: "Saudi",
  //                   value: "260",
  //                 },
  //                 {
  //                   label: "Canada",
  //                   value: "180",
  //                 },
  //                 {
  //                   label: "Iran",
  //                   value: "140",
  //                 },
  //                 {
  //                   label: "Russia",
  //                   value: "115",
  //                 },
  //                 {
  //                   label: "UAE",
  //                   value: "100",
  //                 },
  //                 {
  //                   label: "US",
  //                   value: "30",
  //                 },
  //                 {
  //                   label: "China",
  //                   value: "30",
  //                 },
  //               ],
  //             },
  //           },
  //           transformed: {
  //             type: "area2d",
  //             dataSource: {
  //               data: [
  //                 {
  //                   label: "Venezuela",
  //                   value: "290",
  //                 },
  //                 {
  //                   label: "Saudi",
  //                   value: "260",
  //                 },
  //                 {
  //                   label: "Canada",
  //                   value: "180",
  //                 },
  //                 {
  //                   label: "Iran",
  //                   value: "140",
  //                 },
  //                 {
  //                   label: "Russia",
  //                   value: "115",
  //                 },
  //                 {
  //                   label: "UAE",
  //                   value: "100",
  //                 },
  //                 {
  //                   label: "US",
  //                   value: "30",
  //                 },
  //                 {
  //                   label: "China",
  //                   value: "30",
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       {
  //         input: {
  //           type: undefined,
  //           dataSource: undefined,
  //         },
  //         output: {
  //           isValid: false,
  //           message:
  //             'This value does not evaluate to type "{type: string, dataSource: { chart: object, data: Array<{label: string, value: number}>}}"',
  //           parsed: {
  //             type: undefined,
  //             dataSource: undefined,
  //           },
  //           transformed: {
  //             type: undefined,
  //             dataSource: undefined,
  //           },
  //         },
  //       },
  //     ];
  //     for (const testCase of cases) {
  //       const response = validator(testCase.input, DUMMY_WIDGET, {});
  //       expect(response).toStrictEqual(testCase.output);
  //     }
  //   });
  // });
  // describe("validateDateString test", () => {
  //   it("Check whether the valid date strings are recognized as valid", () => {
  //     const validDateStrings = [
  //       {
  //         date: "2021-03-12T07:13:03.046Z",
  //         format: "",
  //         version: 2,
  //       },
  //       {
  //         date: "2021-03-12",
  //         format: "YYYY-MM-DD",
  //         version: 1,
  //       },
  //       {
  //         date: "2021-03-12",
  //         format: "YYYY-MM-DD",
  //         version: 2,
  //       },
  //     ];

  //     validDateStrings.forEach((item) => {
  //       expect(
  //         validateDateString(item.date, item.format, item.version),
  //       ).toBeTruthy();
  //     });
  //   });

  //   it("Check whether the invalid date strings are recognized as invalid", () => {
  //     const inValidDateStrings = [
  //       {
  //         date: "2021-13-12T07:13:03.046Z",
  //         format: "",
  //         version: 2,
  //       },
  //       {
  //         date: "abcd",
  //         format: "abcd",
  //         version: 2,
  //       },
  //       {
  //         date: "2021-13-12",
  //         format: "YYYY-MM-DD",
  //         version: 1,
  //       },
  //     ];

  //     inValidDateStrings.forEach((item) => {
  //       expect(
  //         validateDateString(item.date, item.format, item.version),
  //       ).toBeFalsy();
  //     });
  //   });

  // it("Checks whether a valid value is returned even if a valid date is not an ISO string", () => {
  //   const validator = VALIDATORS.DEFAULT_DATE;
  //   const inputs = [
  //     "2014/12/01",
  //     "2014-12-01",
  //     "01/13/2014",
  //     "01-13-2014",
  //     moment().toISOString(),
  //     moment().toISOString(true),
  //   ];
  //   inputs.forEach((item) => {
  //     const dateString = moment(item).toISOString(true);
  //     const result = validator(item, DUMMY_WIDGET);

  //     const expected = {
  //       parsed: dateString,
  //       isValid: true,
  //       message: "",
  //     };
  //     expect(result).toStrictEqual(expected);
  //   });
  // });
});

// describe("List data validator", () => {
//   const validator = VALIDATORS.LIST_DATA;
//   it("correctly validates ", () => {
//     const cases = [
//       {
//         input: [],
//         output: {
//           isValid: true,
//           parsed: [],
//         },
//       },
//       {
//         input: [{ a: 1 }],
//         output: {
//           isValid: true,
//           parsed: [{ a: 1 }],
//         },
//       },
//       {
//         input: "sting text",
//         output: {
//           isValid: false,
//           message: 'This value does not evaluate to type: "Array<Object>"',
//           parsed: [],
//           transformed: "sting text",
//         },
//       },
//       {
//         input: undefined,
//         output: {
//           isValid: false,
//           message: 'This value does not evaluate to type: "Array<Object>"',
//           parsed: [],
//           transformed: undefined,
//         },
//       },
//       {
//         input: {},
//         output: {
//           isValid: false,
//           message: 'This value does not evaluate to type: "Array<Object>"',
//           parsed: [],
//           transformed: {},
//         },
//       },
//       {
//         input: `[{ "b": 1 }]`,
//         output: {
//           isValid: true,
//           parsed: JSON.parse(`[{ "b": 1 }]`),
//         },
//       },
//     ];
//     for (const testCase of cases) {
//       const response = validator(testCase.input, DUMMY_WIDGET, {});
//       expect(response).toStrictEqual(testCase.output);
//     }
//   });

//   it("Validates DEFAULT_OPTION_VALUE correctly (string trim and integers)", () => {
//     const validator = VALIDATORS[VALIDATION_TYPES.DEFAULT_OPTION_VALUE];
//     const widgetProps = { ...DUMMY_WIDGET, selectionType: "SINGLE_SELECT" };
//     const inputs = [100, "something ", "something\n"];
//     const expected = [
//       {
//         isValid: true,
//         parsed: "100",
//       },
//       {
//         isValid: true,
//         parsed: "something",
//       },
//       {
//         isValid: true,
//         parsed: "something",
//       },
//     ];
//     inputs.forEach((input, index) => {
//       const response = validator(input, widgetProps);
//       expect(response).toStrictEqual(expected[index]);
//     });
//   });
// });
