import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import { MockCodemirrorEditor } from "../../../../test/__mocks__/CodeMirrorEditorMock";
import RealmExecutor from "jsExecution/RealmExecutor";
jest.mock("jsExecution/RealmExecutor");

describe("hint helpers", () => {
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    RealmExecutor.mockClear();
  });
  describe("binding hint helper", () => {
    it("is initialized correctly", () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const helper = bindingHint(MockCodemirrorEditor, {});
      expect(MockCodemirrorEditor.setOption).toBeCalled();
      expect(helper).toHaveProperty("showHint");
      expect(helper).toHaveProperty("update");
    });

    it("opens hint correctly", () => {
      // Setup
      type Case = {
        value: string;
        cursor: { ch: number; line: number };
        toCall: "closeHint" | "showHint";
        getLine?: string[];
      };
      const cases: Case[] = [
        { value: "ABC", cursor: { ch: 3, line: 0 }, toCall: "closeHint" },
        { value: "{{ }}", cursor: { ch: 3, line: 0 }, toCall: "showHint" },
        {
          value: '{ name: "{{}}" }',
          cursor: { ch: 11, line: 0 },
          toCall: "showHint",
        },
        {
          value: '{ name: "{{}}" }',
          cursor: { ch: 12, line: 0 },
          toCall: "closeHint",
        },
        {
          value: "{somethingIsHere }}",
          cursor: { ch: 18, line: 0 },
          toCall: "closeHint",
        },
        {
          value: `{\n\tname: "{{}}"\n}`,
          getLine: ["{", `\tname: "{{}}`, "}"],
          cursor: { ch: 10, line: 1 },
          toCall: "showHint",
        },
      ];

      cases.forEach(testCase => {
        MockCodemirrorEditor.getValue.mockReturnValueOnce(testCase.value);
        MockCodemirrorEditor.getCursor.mockReturnValueOnce(testCase.cursor);
        if (testCase.getLine) {
          testCase.getLine.forEach(line => {
            MockCodemirrorEditor.getLine.mockReturnValueOnce(line);
          });
        }
      });

      // Test
      cases.forEach(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const helper = bindingHint(MockCodemirrorEditor, {});
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        helper.showHint(MockCodemirrorEditor);
      });

      // Assert
      const showHintCount = cases.filter(c => c.toCall === "showHint").length;
      expect(MockCodemirrorEditor.showHint).toHaveBeenCalledTimes(
        showHintCount,
      );
      const closeHintCount = cases.filter(c => c.toCall === "closeHint").length;
      expect(MockCodemirrorEditor.closeHint).toHaveBeenCalledTimes(
        closeHintCount,
      );
    });
  });
});
