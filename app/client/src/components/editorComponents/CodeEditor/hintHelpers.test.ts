import {
  bindingHintHelper,
  SqlHintHelper,
} from "components/editorComponents/CodeEditor/hintHelpers";
import { MockCodemirrorEditor } from "../../../../test/__mocks__/CodeMirrorEditorMock";
import { random } from "lodash";
import "codemirror/addon/hint/sql-hint";
import { MAX_NUMBER_OF_SQL_HINTS } from "./utils/sqlHint";

jest.mock("./codeEditorUtils", () => {
  const actualExports = jest.requireActual("./codeEditorUtils");

  return {
    __esModule: true,
    ...actualExports,
    isCursorOnEmptyToken: jest.fn(() => false),
  };
});

function generateRandomTable() {
  const table: Record<string, string> = {};

  for (let i = 0; i < 500; i++) {
    table[`T${random(0, 1000)}`] = "string";
  }

  return table;
}

jest.mock("utils/getCodeMirrorNamespace", () => {
  const actual = jest.requireActual("utils/getCodeMirrorNamespace");

  return {
    ...actual,
    getCodeMirrorNamespaceFromDoc: jest.fn((doc) => ({
      ...actual.getCodeMirrorNamespaceFromDoc(doc),
      innerMode: jest.fn(() => ({
        mode: {
          name: "",
        },
        state: {
          lexical: {},
        },
      })),
    })),
  };
});

describe("hint helpers", () => {
  describe("binding hint helper", () => {
    it("is initialized correctly", () => {
      // @ts-expect-error: Types are not available
      const helper = bindingHintHelper(MockCodemirrorEditor, {});

      expect(MockCodemirrorEditor.setOption).toBeCalled();
      expect(helper).toHaveProperty("showHint");
    });

    it("opens hint correctly", () => {
      // Setup
      interface Case {
        value: string;
        cursor: { ch: number; line: number };
        toCall: "closeHint" | "showHint";
        getLine?: string[];
      }
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
        {
          value: "{test(",
          cursor: { ch: 1, line: 0 },
          toCall: "closeHint",
        },
        {
          value: "justanystring {{}}",
          cursor: { ch: 16, line: 0 },
          toCall: "showHint",
        },
      ];

      cases.forEach((testCase) => {
        MockCodemirrorEditor.getValue.mockReturnValueOnce(testCase.value);
        MockCodemirrorEditor.getCursor.mockReturnValue(testCase.cursor);

        if (testCase.getLine) {
          testCase.getLine.forEach((line) => {
            MockCodemirrorEditor.getLine.mockReturnValueOnce(line);
          });
        }

        MockCodemirrorEditor.getTokenAt.mockReturnValueOnce({
          type: "string",
          string: "",
        });
        MockCodemirrorEditor.getDoc.mockReturnValueOnce({
          getCursor: () => testCase.cursor,
          somethingSelected: () => false,
          getValue: () => testCase.value,
          getEditor: () => MockCodemirrorEditor,
        } as unknown as CodeMirror.Doc);
        // @ts-expect-error: Types are not available
        const helper = bindingHintHelper(MockCodemirrorEditor, {});

        // @ts-expect-error: Types are not available
        helper.showHint(MockCodemirrorEditor);
      });

      // Assert
      const showHintCount = cases.filter((c) => c.toCall === "showHint").length;

      expect(MockCodemirrorEditor.showHint).toHaveBeenCalledTimes(
        showHintCount,
      );
      const closeHintCount = cases.filter(
        (c) => c.toCall === "closeHint",
      ).length;

      expect(MockCodemirrorEditor.closeHint).toHaveBeenCalledTimes(
        closeHintCount,
      );
    });
  });

  describe("SQL hinter", () => {
    const hinter = new SqlHintHelper();
    const randomTable = generateRandomTable();

    hinter.setDatasourceTableKeys(randomTable);
    jest.spyOn(hinter, "getCompletions").mockImplementation(() => ({
      from: { line: 1, ch: 1 },
      to: { line: 1, ch: 1 },
      list: Object.keys(randomTable),
    }));

    it("returns no hint when not in SQL mode", () => {
      jest.spyOn(hinter, "isSqlMode").mockImplementationOnce(() => false);
      // @ts-expect-error: actual editor is not required
      const response = hinter.handleCompletions({});

      expect(response.completions).toBe(null);
    });

    it("returns hints when in SQL mode", () => {
      jest.spyOn(hinter, "isSqlMode").mockImplementationOnce(() => true);
      // @ts-expect-error: actual editor is not required
      const response = hinter.handleCompletions({});

      expect(response.completions?.list).toBeTruthy();
    });

    it("Doesn't return hints greater than the threshold", () => {
      jest.spyOn(hinter, "isSqlMode").mockImplementationOnce(() => true);
      // @ts-expect-error: actual editor is not required
      const response = hinter.handleCompletions({});

      expect(response.completions?.list.length).toBeLessThanOrEqual(
        MAX_NUMBER_OF_SQL_HINTS,
      );
    });
  });
});
