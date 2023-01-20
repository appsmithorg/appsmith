import {
  getActionBlocks,
  getFunctionBodyStatements,
  getFunctionName,
  getMainAction,
} from "./index";

describe("getActionBlocks", () => {
  it("should return an array of action blocks", () => {
    const result = getActionBlocks(
      "Api1.run(() => setAlert('Success'), () => {});showModal('Modal1')",
      2,
    );
    expect(result).toEqual([
      "Api1.run(() => setAlert('Success'), () => {});",
      "showModal('Modal1');",
    ]);
  });

  it("should return an array of action blocks", () => {
    const value = "Api1.run(() => {\n  (() => {});\n}, () => {}, {});";
    const result = getActionBlocks(value, 2);
    expect(result).toEqual([
      "Api1.run(() => {\n  (() => {});\n}, () => {}, {});",
    ]);
  });
});

describe("getFunctionBodyStatements", () => {
  it("should return an array of statements for Arrow Function", () => {
    const value = "() => { API1.run(() => {}); API2.run(); };";

    const result = getFunctionBodyStatements(value, 2);

    expect(result).toEqual(["API1.run(() => {});", "API2.run();"]);
  });

  it("should return an array of statements for non Arrow Function", () => {
    const value = "function hello() { API1.run(() => {}); API2.run(); }";

    const result = getFunctionBodyStatements(value, 2);

    expect(result).toEqual(["API1.run(() => {});", "API2.run();"]);
  });

  it("should return an array of statements for nested statements", () => {
    const value = `() => {
      Query1.run(() => {console.log('hello');}, () => {}, {});
    }`;

    const result = getFunctionBodyStatements(value, 2);

    expect(result).toEqual([
      `Query1.run(() => {
  console.log('hello');
}, () => {}, {});`,
    ]);
  });
});

describe("getMainAction", () => {
  it("should return the main action for object property callee", () => {
    const value = "Api1.run(() => setAlert('Success'), () => {});";

    const result = getMainAction(value, 2);

    expect(result).toEqual("Api1.run()");
  });

  it("should return the main action for function call", () => {
    const value = "showAlert('Hello')";

    const result = getMainAction(value, 2);

    expect(result).toEqual("showAlert('Hello')");
  });
});

describe("getFunctionName", () => {
  it("should return the main action for object property callee", () => {
    const value = "Api1.run(() => setAlert('Success'), () => {});";

    const result = getFunctionName(value, 2);

    expect(result).toEqual("Api1.run");
  });

  it("should return the main action for function call", () => {
    const value = "showAlert('Hello')";

    const result = getFunctionName(value, 2);

    expect(result).toEqual("showAlert");
  });
});
