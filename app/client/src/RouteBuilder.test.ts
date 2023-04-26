import { getQueryStringfromObject } from "./RouteBuilder";

describe("Route builder", () => {
  describe("tests getQueryStringfromObject", () => {
    const cases = [
      {
        index: 0,
        input: { id: 0, a: "b&c ltd" },
        expected: "?id=0&a=b%26c%20ltd",
      },
      { index: 1, input: {}, expected: "" },
      {
        index: 2,
        input: { rando: "রিমিল" },
        expected: "?rando=%E0%A6%B0%E0%A6%BF%E0%A6%AE%E0%A6%BF%E0%A6%B2",
      },
      {
        index: 3,
        input: { a1: "1234*&^%~`<>:';,./?" },
        expected: "?a1=1234*%26%5E%25~%60%3C%3E%3A'%3B%2C.%2F%3F",
      },
      { index: 4, input: { isSignedIn: false }, expected: "?isSignedIn=false" },
    ];

    test.each(cases.map((x) => [x.index, x.input, x.expected]))(
      "test case %d",
      (_, input, expected) => {
        const result = getQueryStringfromObject(input as any);
        expect(result).toStrictEqual(expected);
      },
    );
  });
});
