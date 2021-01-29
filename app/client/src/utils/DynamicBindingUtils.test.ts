import {
  getDynamicStringSegments,
  isChildPropertyPath,
} from "./DynamicBindingUtils";

describe.each([
  ["{{A}}", ["{{A}}"]],
  ["A {{B}}", ["A ", "{{B}}"]],
  [
    "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
    [
      "Hello ",
      "{{Customer.Name}}",
      ", the status for your order id ",
      "{{orderId}}",
      " is ",
      "{{status}}",
    ],
  ],
  [
    "{{data.map(datum => {return {id: datum}})}}",
    ["{{data.map(datum => {return {id: datum}})}}"],
  ],
  ["{{}}{{}}}", ["{{}}", "{{}}", "}"]],
  ["{{{}}", ["{{{}}"]],
  ["{{ {{", ["{{ {{"]],
  ["}} }}", ["}} }}"]],
  ["}} {{", ["}} {{"]],
])("Parse the dynamic string(%s, %j)", (dynamicString, expected) => {
  test(`returns ${expected}`, () => {
    expect(getDynamicStringSegments(dynamicString as string)).toStrictEqual(
      expected,
    );
  });
});

describe("isChildPropertyPath function", () => {
  it("works", () => {
    const cases: Array<[string, string, boolean]> = [
      ["Table1.selectedRow", "Table1.selectedRow", true],
      ["Table1.selectedRow", "Table1.selectedRows", false],
      ["Table1.selectedRow", "Table1.selectedRow.email", true],
      ["Table1.selectedRow", "1Table1.selectedRow", false],
      ["Table1.selectedRow", "Table11selectedRow", false],
      ["Table1.selectedRow", "Table1.selectedRow", true],
      ["Dropdown1.options", "Dropdown1.options[1]", true],
      ["Dropdown1.options[1]", "Dropdown1.options[1].value", true],
      ["Dropdown1", "Dropdown1.options[1].value", true],
    ];
    cases.forEach((testCase) => {
      const result = isChildPropertyPath(testCase[0], testCase[1]);
      expect(result).toBe(testCase[2]);
    });
  });
});
