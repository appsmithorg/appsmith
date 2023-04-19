import { getDisplayMessageFromError } from "./errorUtils";

describe("Test getDisplayMessageFromError", () => {
  const cases = [
    {
      index: 0,
      input: "ReferenceError: a is not defined",
      expected: "a is not defined",
    },
    {
      index: 1,
      input: "UncaughtPromiseRejection: Enter a valid URL or page name",
      expected: "Enter a valid URL or page name",
    },
    {
      index: 2,
      input: "UncaughtPromiseRejection: Please enter a file name",
      expected: "Please enter a file name",
    },
    {
      index: 3,
      input: "ReferenceError: adlsgkbj is not defined",
      expected: "adlsgkbj is not defined",
    },
    {
      index: 4,
      input: "User denied Geolocation",
      expected: "User denied Geolocation",
    },
    {
      index: 5,
      input: "No location watch active",
      expected: "No location watch active",
    },
    {
      index: 6,
      input: "Please enter a target origin URL.",
      expected: "Please enter a target origin URL.",
    },
  ];

  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = getDisplayMessageFromError(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});
