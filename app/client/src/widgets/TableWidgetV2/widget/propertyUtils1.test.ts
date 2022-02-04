import { defaultSelectedRowValidation } from "./propertyUtils";
import _ from "lodash";
import { TableWidgetProps } from "../constants";

describe("PropertyUtils - ", () => {
  describe("defaultSelectedRowValidation - ", () => {
    it("check validations when multiRowSelection is off", () => {
      const testValues = [
        [
          "-1",
          {
            isValid: false,
            parsed: -1,
            message: ["This value should be a postive integer"],
          },
        ],
        [
          "test",
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          -1,
          {
            isValid: false,
            parsed: -1,
            message: ["This value should be a postive integer"],
          },
        ],
        [
          [],
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          [1, 2, "3"],
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          null,
          {
            isValid: true,
            parsed: -1,
            message: [""],
          },
        ],
        [
          {},
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          "{1: 'test'}",
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          "",
          {
            isValid: true,
            parsed: -1,
            message: [""],
          },
        ],
        [
          1,
          {
            isValid: true,
            parsed: 1,
            message: [""],
          },
        ],
        [
          100,
          {
            isValid: true,
            parsed: 100,
            message: [""],
          },
        ],
      ];

      testValues.forEach(([value, expected]) => {
        expect(
          defaultSelectedRowValidation(
            value,
            { multiRowSelection: false } as TableWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });

    it("check validations when multiRowSelection is on", () => {
      const testValues = [
        [
          "[1, 2]",
          {
            parsed: [1, 2],
          },
        ],
        [
          "-1",
          {
            isValid: false,
            parsed: -1,
            message: ["This value should be a postive integer"],
          },
        ],
        [
          -1,
          {
            isValid: false,
            parsed: -1,
            message: ["This value should be a postive integer"],
          },
        ],
        [
          [],
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          [1, 2, "3"],
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          null,
          {
            isValid: true,
            parsed: -1,
            message: [""],
          },
        ],
        [
          {},
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          "{1: 'test'}",
          {
            isValid: false,
            parsed: -1,
            message: ["This value does not match type: number"],
          },
        ],
        [
          "",
          {
            isValid: true,
            parsed: -1,
            message: [""],
          },
        ],
        [
          1,
          {
            isValid: true,
            parsed: 1,
            message: [""],
          },
        ],
        [
          100,
          {
            isValid: true,
            parsed: 100,
            message: [""],
          },
        ],
      ];

      testValues.forEach(([value, expected]) => {
        expect(
          defaultSelectedRowValidation(
            value,
            { multiRowSelection: false } as TableWidgetProps,
            _,
          ),
        ).toEqual(expected);
      });
    });
  });
});
