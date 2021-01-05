import { getDynamicStringSegments } from "./DynamicBindingUtils";

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
