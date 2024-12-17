import derivedProperty from "../../derived";

describe("getPageOffset -", () => {
  it("should return 0 when pageNo is null", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: null,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageSize is null", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 0,
        pageSize: null,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageSize is undefined", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 0,
        pageSize: undefined,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageNo is undefined", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: undefined,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageSize is 0 and pageNo is any random number >= 0", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 10,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageNo is 0 and pageSize is any random number >= 0", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 0,
        pageSize: 100,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageNo is NaN", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: NaN,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 10 when pageSize is 5 and pageNo is 3", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 3,
        pageSize: 5,
      }),
    ).toEqual(10);
  });
});
