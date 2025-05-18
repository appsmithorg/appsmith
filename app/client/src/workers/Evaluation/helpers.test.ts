import { fn_keys, stringifyFnsInObject, updatePrevState } from "./helpers";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";

describe("stringifyFnsInObject", () => {
  it("includes full path of key having a function in the parent object", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          fnKey: () => {},
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.fnKey"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.fnKey"],
      key1: "value",
      key2: {
        key3: {
          fnKey: "() => { }",
        },
      },
    });
  });

  it("includes an array index if a function is present inside an array", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", () => {}, "string3"],
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.key4.[1]"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.key4.[1]"],
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", "() => { }", "string3"],
        },
      },
    });
  });

  it("includes an array index if a function is present inside a nested object inside an array", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", { key5: () => {}, key6: "value" }, "string3"],
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.key4.[1].key5"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.key4.[1].key5"],
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", { key5: "() => { }", key6: "value" }, "string3"],
        },
      },
    });
  });

  it("includes a nested array index if a function is present inside a nested array inside an array", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", [() => {}], "string3"],
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.key4.[1].[0]"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.key4.[1].[0]"],
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", ["() => { }"], "string3"],
        },
      },
    });
  });
});

describe("updatePrevState", () => {
  it("should update prevState with dataTree when isUpdateCycle is false", () => {
    // Create a simple dataTree
    const dataTree = {
      Button1: {
        ENTITY_TYPE: "WIDGET",
        text: "Click me",
        type: "BUTTON_WIDGET",
        widgetId: "button1",
      },
      Text1: {
        ENTITY_TYPE: "WIDGET",
        text: "Hello World",
        type: "TEXT_WIDGET",
        widgetId: "text1",
      },
    } as unknown as DataTree;

    // Create a mock dataTreeEvaluator
    const dataTreeEvaluator = {
      setPrevState: jest.fn(),
      getPrevState: jest.fn(),
    };

    // Call updatePrevState with isUpdateCycle = false
    updatePrevState(false, dataTreeEvaluator, "[]", dataTree);

    // Verify setPrevState was called with the dataTree
    expect(dataTreeEvaluator.setPrevState).toHaveBeenCalledWith(dataTree);
  });

  it("should update prevState with serialized updates when isUpdateCycle is true", () => {
    // Create a simple dataTree
    const dataTree = {
      Button1: {
        ENTITY_TYPE: "WIDGET",
        text: "Click me",
        type: "BUTTON_WIDGET",
        widgetId: "button1",
      },
    } as unknown as DataTree;

    // Create a mock dataTreeEvaluator with a prevState
    const prevState = {
      Button1: {
        ENTITY_TYPE: "WIDGET",
        text: "Old text",
        type: "BUTTON_WIDGET",
        widgetId: "button1",
      },
    } as unknown as DataTree;

    const dataTreeEvaluator = {
      setPrevState: jest.fn(),
      getPrevState: jest.fn().mockReturnValue(prevState),
    };

    // Create serialized updates that change Button1.text
    const serializedUpdates = JSON.stringify([
      {
        kind: "E",
        path: ["Button1", "text"],
        rhs: "New text",
      },
    ]);

    // Call updatePrevState with isUpdateCycle = true
    updatePrevState(true, dataTreeEvaluator, serializedUpdates, dataTree);

    // Verify setPrevState was called with an updated state
    expect(dataTreeEvaluator.setPrevState).toHaveBeenCalled();
    const updatedState = dataTreeEvaluator.setPrevState.mock.calls[0][0];

    expect(updatedState.Button1.text).toBe("New text");
  });

  it("should handle errors during update and push them to dataTreeEvaluator.errors", () => {
    // Create a simple dataTree
    const dataTree = {
      Button1: {
        ENTITY_TYPE: "WIDGET",
        text: { a: 1 },
        type: "BUTTON_WIDGET",
        widgetId: "button1",
      },
    } as unknown as DataTree;

    // Create a mock dataTreeEvaluator with a prevState
    const prevState = {
      Button1: {
        ENTITY_TYPE: "WIDGET",
        text: [],
        type: "BUTTON_WIDGET",
        widgetId: "button1",
      },
    } as unknown as DataTree;

    const dataTreeEvaluator = {
      setPrevState: jest.fn(),
      getPrevState: jest.fn().mockReturnValue(prevState),
      errors: [] as Array<{ type: string; message: string }>,
    };

    // Create serialized updates with an invalid path to trigger an error
    const serializedUpdates = JSON.stringify([
      {
        kind: "N",
        path: ["Button1", "text", "a"],
        rhs: "New text",
      },
    ]);

    // Call updatePrevState with isUpdateCycle = true
    updatePrevState(true, dataTreeEvaluator, serializedUpdates, dataTree);

    // Verify an error was pushed to dataTreeEvaluator.errors
    expect(dataTreeEvaluator.errors.length).toBe(1);
    expect(dataTreeEvaluator.errors[0].type).toBe(
      EvalErrorTypes.UPDATE_DATA_TREE_ERROR,
    );
    expect(dataTreeEvaluator.errors[0].message).toBeTruthy();
  });
});
