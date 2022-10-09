import "./TimeoutOverride";
import { MOCK_EVAL_TREE } from "./__tests__/evaluation.mockData";
// import { dataTreeEvaluator } from "./evaluation.worker";
// import evaluate from "./evaluate";
import overrideTimeout from "./TimeoutOverride";
jest.mock("./evaluation.worker.ts", () => {
  return {
    dataTreeEvaluator: {
      evalTree: MOCK_EVAL_TREE,
      resolvedFunctions: {},
    },
  };
});

describe("Expects appsmith setTimeout to pass the following criteria", () => {
  jest.useFakeTimers();
  overrideTimeout();
  const setTimeout = self.setTimeout;
  self.postMessage = jest.fn();
  it("returns a number a timerId", () => {
    const timerId = setTimeout(jest.fn(), 1000);
    expect(timerId).toBeDefined();
    expect(typeof timerId).toBe("number");
  });
  it("Passes arguments into callback", () => {
    const cb = jest.fn();
    const args = [1, 2, "3", [4]];
    setTimeout(cb, 1000, ...args);
    expect(cb.mock.calls.length).toBe(0);
    jest.runAllTimers();
    expect(cb).toHaveBeenCalledWith(...args);
  });
  it("Has weird behavior with 'this' keyword", () => {
    const cb = jest.fn();
    const error = jest.fn();
    const obj = {
      var1: "myVar1",
      getVar() {
        try {
          cb(this.var1);
        } catch (e) {
          error(e);
        }
      },
    };
    setTimeout(obj.getVar, 1000);
    expect(cb.mock.calls.length).toBe(0);
    jest.runAllTimers();
    expect(error).toBeCalled();
  });
  it("Has weird behavior with 'this' keyword", () => {
    const cb = jest.fn();
    const error = jest.fn();
    const obj = {
      var1: "myVar1",
      getVar() {
        try {
          cb(this.var1);
        } catch (e) {
          error(e);
        }
      },
    };
    setTimeout(obj.getVar.bind(obj), 1000);
    expect(cb.mock.calls.length).toBe(0);
    jest.runAllTimers();
    expect(cb).toBeCalledWith(obj.var1);
  });
  it("'this' behavior should be fixed by binding this", () => {
    const cb = jest.fn();
    const error = jest.fn();
    const obj = {
      var1: "myVar1",
      getVar() {
        try {
          cb(this.var1);
        } catch (e) {
          error(e);
        }
      },
    };
    setTimeout(obj.getVar.bind(obj), 1000);
    expect(cb.mock.calls.length).toBe(0);
    jest.runAllTimers();
    expect(cb).toBeCalledWith(obj.var1);
  });
  it("Checks the behavior of clearTimeout", () => {
    const cb = jest.fn();
    const timerId = setTimeout(cb, 1000);
    expect(cb.mock.calls.length).toBe(0);
    clearTimeout(timerId);
    jest.runAllTimers();
    expect(cb.mock.calls.length).toBe(0);
  });
  // it("Access to appsmith functions inside setTimeout", async () => {
  //   const code = "setTimeout(() => Api1.run(), 1000)";
  //   await evaluate(
  //     code,
  //     dataTreeEvaluator?.evalTree || {},
  //     dataTreeEvaluator?.resolvedFunctions || {},
  //     {
  //       enableAppsmithFunctions: true,
  //     },
  //   );
  //   jest.runAllTimers();
  //   expect(self.postMessage).toBeCalled();
  // });
});
