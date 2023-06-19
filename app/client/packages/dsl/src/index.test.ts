import { nestDSL, unnestDSL } from "./DSL";

describe("Test#1", () => {
  it("nestDSL is a function", () => {
    expect(typeof nestDSL).toBe("function");
  });

  it("unnestDSL is a function", () => {
    expect(typeof unnestDSL).toBe("function");
  });
});

export {};
