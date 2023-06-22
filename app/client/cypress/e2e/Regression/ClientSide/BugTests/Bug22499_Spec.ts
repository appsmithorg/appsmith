import * as _ from "../../../../support/Objects/ObjectsCore";

const { jsEditor } = _;

describe("Bug 22499 - Debugger shortcut is deleting line  on the editor", () => {
  it("Line is deleting when using Cmd+D in the JS object instead of only opening the debugger", () => {
    jsEditor.CreateJSObject("");
  });
});
