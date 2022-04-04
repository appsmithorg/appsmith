import isEqual from "lodash/isEqual";
import { klona } from "klona/full";
import moment from "moment";

describe("Klona clone test", () => {
  it("Strings, Booleans, numbers, null & undefined values", () => {
    const inputEvalTree: {
      meta: {
        stringLiteral: string;
        string: string;
        boolean: boolean;
        number: number;
        nan: number;
        null: null | string;
        undefined: undefined | number;
      };
    } = {
      meta: {
        stringLiteral: "abc",
        string: String("ABC"),
        boolean: true,
        number: Number(45),
        nan: NaN,
        null: null,
        undefined: undefined,
      },
    };

    const expected: Record<string, unknown> = {
      meta: {
        stringLiteral: "abc",
        string: String("ABC"),
        boolean: true,
        number: Number(45),
        nan: NaN,
        null: null,
        undefined: undefined,
      },
    };
    const result = klona(inputEvalTree);

    // mutate
    inputEvalTree.meta.string = "hello1";
    inputEvalTree.meta.boolean = false;
    inputEvalTree.meta.number = Number(89);
    inputEvalTree.meta.null = "efewf";
    inputEvalTree.meta.undefined = NaN;

    expect(isEqual(expected, result)).toEqual(true);
  });

  it("Dates and regex values", () => {
    const currentDate = new Date();
    const currentMoment = moment();
    const inputEvalTree = {
      meta: {
        date: currentDate,
        moment: currentMoment,
        regex: /^abc$/g,
        regexExp: new RegExp(/^abc$/),
      },
    };

    const expected = {
      meta: {
        date: currentDate,
        moment: currentMoment,
        regex: /^abc$/g,
        regexExp: new RegExp(/^abc$/),
      },
    };
    const result = klona(inputEvalTree);

    // mutate
    inputEvalTree.meta.date = new Date(327392879);
    inputEvalTree.meta.moment = moment();
    inputEvalTree.meta.regex = /^def$/g;
    inputEvalTree.meta.regexExp = new RegExp(/^def$/);

    expect(isEqual(expected, result)).toEqual(true);
  });

  it("Objects and Arrays values", () => {
    const nestedArray = [
      "foo",
      [1, 2, ["hello", "world"], 3],
      "bar",
      "baz",
      {},
    ];

    const objectWithMethod = Object.create({
      method() {
        return "hello";
      },
      moment: moment(""),
    });

    const nestedObject = Object.create({
      Input: { text: "abc" },
    });

    const inputEvalTree = {
      meta: {
        nestedArray: [...nestedArray],
        objectWithMethod,
        nestedObject: { ...nestedObject },
      },
    };

    const expected = {
      meta: {
        nestedArray: [...nestedArray],
        objectWithMethod,
        nestedObject: { ...nestedObject },
      },
    };

    const result = klona(inputEvalTree);

    // mutate
    inputEvalTree.meta.nestedArray[0] = "abc";
    inputEvalTree.meta.nestedArray[1] = { a: "bc" };
    inputEvalTree.meta.nestedObject.value = "hello";

    expect(
      isEqual(expected.meta.nestedArray[0], result.meta.nestedArray[0]),
    ).toEqual(true);
    expect(
      isEqual(expected.meta.nestedArray[1], result.meta.nestedArray[1]),
    ).toEqual(true);
    expect(
      isEqual(
        expected.meta.objectWithMethod.method(),
        result.meta.objectWithMethod.method(),
      ),
    ).toEqual(true);
    expect(
      isEqual(expected.meta.nestedObject.value, result.meta.nestedObject.value),
    ).toEqual(true);
  });

  // it("Functions, Pollutions and Classes values", () => {
  //   const inputEvalTree = {
  //     Input: {
  //       meta: {
  //         text: "",
  //         regex: /aa/g,
  //       },
  //     },
  //   };

  //   const expected = 5;
  //   const result = klona(inputEvalTree);

  //   inputEvalTree.Input.meta.text = "hello1";
  //   expect(result).toStrictEqual(expected);
  // });

  // it("Maps and Sets values", () => {
  //   const inputEvalTree = {
  //     Input: {
  //       meta: {
  //         text: "",
  //         regex: /aa/g,
  //       },
  //     },
  //   };

  //   const expected = 5;
  //   const result = klona(inputEvalTree);

  //   inputEvalTree.Input.meta.text = "hello1";
  //   expect(result).toStrictEqual(expected);
  // });

  // it("TypedArrays values", () => {
  //   const inputEvalTree = {
  //     Input: {
  //       meta: {
  //         text: "",
  //         regex: /aa/g,
  //       },
  //     },
  //   };

  //   const expected = 5;
  //   const result = klona(inputEvalTree);

  //   inputEvalTree.Input.meta.text = "hello1";
  //   expect(result).toStrictEqual(expected);
  // });

  // it("Symbols, Descriptors and Dicts values", () => {
  //   const inputEvalTree = {
  //     Input: {
  //       meta: {
  //         text: "",
  //         regex: /aa/g,
  //       },
  //     },
  //   };

  //   const expected = 5;
  //   const result = klona(inputEvalTree);

  //   inputEvalTree.Input.meta.text = "hello1";
  //   expect(result).toStrictEqual(expected);
  // });
});
