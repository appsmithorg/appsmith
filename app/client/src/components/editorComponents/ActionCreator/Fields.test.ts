jest.mock("sagas/ActionExecution/NavigateActionSaga", () => ({
  __esModule: true,
  default: "",
  NavigationTargetType: { SAME_WINDOW: "" },
}));

import { argsStringToArray } from "./Fields";

describe("Test argStringToArray", () => {
  const cases = [
    { index: 0, input: "", expected: [""] },
    { index: 1, input: "'a'", expected: ["'a'"] },
    { index: 2, input: "a", expected: ["a"] },
    { index: 3, input: "'a,b,c'", expected: ["'a,b,c'"] },
    { index: 4, input: "a,b,c", expected: ["a", "b", "c"] },
    { index: 5, input: "a, b, c", expected: ["a", " b", " c"] },
    { index: 6, input: "a , b , c", expected: ["a ", " b ", " c"] },
    { index: 7, input: "a\n,\nb,\nc", expected: ["a\n", "\nb", "\nc"] },
    { index: 8, input: "[a,b,c]", expected: ["[a,b,c]"] },
    { index: 9, input: "[a, b, c]", expected: ["[a, b, c]"] },
    {
      index: 10,
      input: "[\n\ta,\n\tb,\n\tc\n]",
      expected: ["[\n\ta,\n\tb,\n\tc\n]"],
    },
    { index: 11, input: "{a:1,b:2,c:3}", expected: ["{a:1,b:2,c:3}"] },
    {
      index: 12,
      input: '{"a":1,"b":2,"c":3}',
      expected: ['{"a":1,"b":2,"c":3}'],
    },
    {
      index: 13,
      input: "{\n\ta:1,\n\tb:2,\n\tc:3}",
      expected: ["{\n\ta:1,\n\tb:2,\n\tc:3}"],
    },
    {
      index: 14,
      input: "()=>{}",
      expected: ["()=>{}"],
    },
    {
      index: 15,
      input: "(a, b)=>{return a+b}",
      expected: ["(a, b)=>{return a+b}"],
    },
    {
      index: 16,
      input: "(a, b)=>{\n\treturn a+b;\n\t}",
      expected: ["(a, b)=>{\n\treturn a+b;\n\t}"],
    },
    {
      index: 17,
      input: "(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}",
      expected: ["(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}"],
    },
    {
      index: 18,
      input: `() => {return 5}`,
      expected: ["() => {return 5}"],
    },
    {
      index: 19,
      input: `(a) => {return a + 1}`,
      expected: ["(a) => {return a + 1}"],
    },
    {
      index: 20,
      input: `(a, b) => {return a + b}`,
      expected: ["(a, b) => {return a + b}"],
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = argsStringToArray(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});
