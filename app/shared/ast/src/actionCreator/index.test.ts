import {
  getFuncExpressionAtPosition,
  setCallbackFunctionField,
  getActionBlocks,
  getFunctionBodyStatements,
  getFunctionName,
  getMainAction,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
} from "./index";

describe("getFuncExpressionAtPosition", () => {
  it("should return the function expression at the position", () => {
    const value =
      "Api1.run(() => setAlert('Success'), () => showModal('Modal1'));";

    const result = getFuncExpressionAtPosition(value, 1, 2);

    expect(result).toEqual("() => showModal('Modal1')");
  });

  it("should return empty string when function expression is not present at the position", () => {
    const value = "Api1.run();";

    const result = getFuncExpressionAtPosition(value, 0, 2);

    expect(result).toEqual("");
  });

  it("should return the arguments from the first property", () => {
    const value =
      "Api2.run(() => setAlert('Success'), () => showModal('Modal1')).then(() => {});";

    const result = getFuncExpressionAtPosition(value, 1, 2);

    expect(result).toEqual("() => showModal('Modal1')");
  });

  it("should return the arguments from the first property", () => {
    const value = "appsmith.geolocation.getCurrentPosition((location) => {});"

    const result = getFuncExpressionAtPosition(value, 0, 2);

    expect(result).toEqual("location => {}");
  })
});

describe("setCallbackFunctionField", () => {
  it("should set the expression at the position when no arguments exist", () => {
    const value = "Api1.run();";

    const functionToAdd = "() => setAlert('Success')";

    const result = setCallbackFunctionField(value, functionToAdd, 1, 2);

    expect(result).toEqual("Api1.run(() => setAlert('Success'));");
  });

  it("should set the expression at the position", () => {
    const value = "Api1.run(() => showModal('Modal1'), () => {});";

    const functionToAdd = "() => setAlert('Success')";

    const result = setCallbackFunctionField(value, functionToAdd, 1, 2);

    expect(result).toEqual(
      "Api1.run(() => showModal('Modal1'), () => setAlert('Success'));",
    );
  });

  it("should be able to set Dynamic bindings as argument", () => {
    const value = "showAlert('hello', '');";

    const message = "Button1.text";

    const result = setCallbackFunctionField(value, message, 0, 2);

    expect(result).toEqual("showAlert(Button1.text, '');");
  });

  it("should be able to set empty string as argument", () => {
    const value =
      "appsmith.geolocation.getCurrentPosition(() => { console.log('hello'); });";

    const callbackFunction = "";

    const result = setCallbackFunctionField(value, callbackFunction, 0, 2);

    expect(result).toEqual("appsmith.geolocation.getCurrentPosition();");
  });

  it("should be able to set empty string as argument", () => {
    const value = "Api1.run(() => showModal('Modal1'), () => {});";

    const callbackFunction = "";

    const result = setCallbackFunctionField(value, callbackFunction, 0, 2);

    expect(result).toEqual("Api1.run('', () => {});");
  });

  it("should be able to set empty string as argument", () => {
    const value = "showAlert('hello', '');";

    const message = "";

    const result = setCallbackFunctionField(value, message, 0, 2);

    expect(result).toEqual("showAlert('', '');");
  });
});

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

describe("getThenCatchBlocksFromQuery", () => {
  it("should return then/catch callbacks appropriately", () => {
    const value = "Api1.run().then(() => { a() }).catch(() => { b() });";

    const result = getThenCatchBlocksFromQuery(value, 2);

    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        catch: "() => {\n  b();\n}",
        then: "() => {\n  a();\n}",
      }),
    );
  });

  it("should return then/catch callbacks appropriately", () => {
    const value = "Api1.run().catch(() => { a() }).then(() => { b() });";

    const result = getThenCatchBlocksFromQuery(value, 2);

    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        then: `() => {\n  b();\n}`,
        catch: `() => {\n  a();\n}`,
      }),
    );
  });

  it("should return then callback appropriately", () => {
    const value = "Api1.run().then(() => { a() });";

    const result = getThenCatchBlocksFromQuery(value, 2);

    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        then: `() => {\n  a();\n}`,
      }),
    );
  });

  it("should return catch callback appropriately", () => {
    const value = "Api1.run().catch(() => { a() });";

    const result = getThenCatchBlocksFromQuery(value, 2);

    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        catch: `() => {\n  a();\n}`,
      }),
    );
  });
});

describe("setThenBlockInQuery", () => {
  it("should set then callback when catch block is present", () => {
    const value = "Api1.run().then(() => { a() }).catch(() => { c() });";

    const result = setThenBlockInQuery(value, "() => { b() }", 2);

    expect(result).toEqual(
      "Api1.run().then(() => {\n  b();\n}).catch(() => {\n  c();\n});",
    );
  });
});

describe("setCatchBlockInQuery", () => {
  it("should set catch callback appropriately", () => {
    const value = "Api2.run().then(() => { a() }).catch(() => { c() });";

    const result = setCatchBlockInQuery(value, "() => { b() }", 2);

    expect(result).toEqual(
      "Api2.run().then(() => {\n  a();\n}).catch(() => {\n  b();\n});",
    );
  });
});
