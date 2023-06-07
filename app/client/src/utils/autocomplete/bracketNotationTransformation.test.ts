import { getTransformedText } from "./bracketNotationTransformation";

describe("getTransformedText", () => {
  it("transform Blank Spaced Object Key To Bracket Notation", () => {
    const cases = [
      {
        index: 0,
        input: "this.a b",
        expected: "this.a['b']",
      },
      {
        index: 1,
        input: "a b",
        expected: "a b",
      },
      {
        index: 2,
        input: "Api1.data name",
        expected: "Api1.data['name']",
      },
      {
        index: 3,
        input: "this.b + this.c",
        expected: "this.b + this.c",
      },
      {
        index: 4,
        input: "this.a += 1826",
        expected: "this.a += 1826",
      },
      {
        index: 5,
        input: "import * from './File';",
        expected: "import * from './File';",
      },
      {
        index: 6,
        input: "'this.a b c'",
        expected: "'this.a b c'",
      },
      {
        index: 7,
        input: "`this.a b c`",
        expected: "`this.a b c`",
      },
      {
        index: 8,
        input: "0.18",
        expected: "0.18",
      },
      {
        index: 9,
        input: "0.18 0.26",
        expected: "0.18 0.26",
      },
      {
        index: 10,
        input: "Api1.data[0] name common",
        expected: "Api1.data[0]['name']['common']",
      },
      {
        index: 11,
        input: "Api1['data'][0].name common",
        expected: "Api1['data'][0].name['common']",
      },
      {
        index: 12,
        input: "Api1.data[0]['name'] common",
        expected: "Api1.data[0]['name']['common']",
      },
      {
        index: 13,
        input: "Api1['data'][0]['name'] common",
        expected: "Api1['data'][0]['name']['common']",
      },
      {
        index: 14,
        input: "JSObject1.myVar1 this.a",
        expected: "JSObject1.myVar1[this.a]",
      },
      {
        index: 15,
        input: "const a = JSObject1.myVar1 this.a",
        expected: "const a = JSObject1.myVar1[this.a]",
      },
      {
        index: 16,
        input: "const a = JSObject1.myVar1 this.a + JSObject1.myVar2 this.b",
        expected:
          "const a = JSObject1.myVar1[this.a] + JSObject1.myVar2[this.b]",
      },
      {
        index: 17,
        input: "const a = 0.18 + this.a b",
        expected: "const a = 0.18 + this.a['b']",
      },
      {
        index: 18,
        input: "const a = 0.18 + this.a b + 0.26",
        expected: "const a = 0.18 + this.a['b'] + 0.26",
      },
    ];

    cases.forEach(({ expected, input }) => {
      const val = getTransformedText(input.split(" "));
      expect(val).toStrictEqual(expected);
    });
  });
});
