import _ from "lodash";
import { sourceDataArrayValidation } from "./validations";

describe("sourceDataArrayValidation", () => {
  it("Should test with valid values", () => {
    const mockSourceData = [
      {
        step: "#1",
        task: "Drop a table",
        status: "✅",
        action: "",
      },
      {
        step: "#2",
        task: "Create a query fetch_users with the Mock DB",
        status: "--",
        action: "",
      },
      {
        step: "#3",
        task: "Bind the query using => fetch_users.data",
        status: "--",
        action: "",
      },
    ];

    const result = sourceDataArrayValidation(
      mockSourceData,
      undefined as any,
      _,
    );
    const expected = {
      isValid: true,
      parsed: mockSourceData,
      messages: [""],
    };
    expect(result).toStrictEqual(expected);
  });

  it("Should test when sourceData has a length more than 10", () => {
    const mockSourceData = Array(11).fill((_: null, index: number) => {
      return {
        step: `#${index}`,
        task: `Task ${index}`,
        status: "--",
        action: "",
      };
    });

    const result = sourceDataArrayValidation(
      mockSourceData,
      undefined as any,
      _,
    );
    const expected = {
      isValid: false,
      parsed: [],
      messages: ["Source data cannot have more than 10 items"],
    };
    expect(result).toStrictEqual(expected);
  });

  it("Should test when sourceData is not an array", () => {
    const mockSourceData = {
      step: "#1",
      task: "Drop a table",
      status: "✅",
      action: "",
    };

    const result = sourceDataArrayValidation(
      mockSourceData,
      undefined as any,
      _,
    );
    const expected = {
      isValid: false,
      parsed: [],
      messages: ["This value does not evaluate to type Array"],
    };
    expect(result).toStrictEqual(expected);
  });
});
