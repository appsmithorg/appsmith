import TernServer from "./TernServer";
import { MockCodemirrorEditor } from "../../../test/__mocks__/CodeMirrorEditorMock";
jest.mock("jsExecution/RealmExecutor");

describe("Tern server", () => {
  it("Check whether the correct value is being sent to tern", () => {
    const ternServer = new TernServer({});

    const testCases = [
      {
        name: "test",
        doc: ({
          getCursor: () => ({ ch: 0, line: 0 }),
          getLine: () => "{{Api.}}",
        } as unknown) as CodeMirror.Doc,
        changed: null,
      },
      {
        name: "test",
        doc: ({
          getCursor: () => ({ ch: 0, line: 0 }),
          getLine: () => "a{{Api.}}",
        } as unknown) as CodeMirror.Doc,
        changed: null,
      },
      {
        name: "test",
        doc: ({
          getCursor: () => ({ ch: 2, line: 0 }),
          getLine: () => "a{{Api.}}",
        } as unknown) as CodeMirror.Doc,
        changed: null,
      },
    ];
    const expectedValues = ["{{Api.}}", "a{{Api.}}", "{{Api.}}"];

    testCases.forEach((testCase, index) => {
      const value = ternServer.getFocusedDynamicValue(testCase);
      expect(value).toBe(expectedValues[index]);
    });
  });

  it("Check whether the correct position is sent for querying autocomplete", () => {
    const ternServer = new TernServer({});
    const testCases = [
      {
        name: "test",
        doc: ({
          getCursor: () => ({ ch: 0, line: 0 }),
          getLine: () => "{{Api.}}",
          somethingSelected: () => false,
        } as unknown) as CodeMirror.Doc,
        changed: null,
      },
      {
        name: "test",
        doc: ({
          getCursor: () => ({ ch: 0, line: 1 }),
          getLine: () => "{{Api.}}",
          somethingSelected: () => false,
        } as unknown) as CodeMirror.Doc,
        changed: null,
      },
      {
        name: "test",
        doc: ({
          getCursor: () => ({ ch: 3, line: 1 }),
          getLine: () => "g {{Api.}}",
          somethingSelected: () => false,
        } as unknown) as CodeMirror.Doc,
        changed: null,
      },
    ];
    const expectedValues = [
      { ch: 0, line: 0 },
      { ch: 0, line: 0 },
      { ch: 1, line: 0 },
    ];

    testCases.forEach((testCase, index) => {
      const request = ternServer.buildRequest(testCase, {});

      expect(request.query.end).toEqual(expectedValues[index]);
    });
  });

  it(`Check whether the position is evaluated correctly for placing the selected 
      autocomplete value`, () => {
    const ternServer = new TernServer({});

    const testCases = [
      {
        codeEditor: {
          value: "{{}}",
          cursor: { ch: 2, line: 0 },
          doc: ({
            getCursor: () => ({ ch: 2, line: 0 }),
            getLine: () => "{{}}",
            somethingSelected: () => false,
          } as unknown) as CodeMirror.Doc,
        },
        requestCallbackData: {
          completions: [{ name: "Api1" }],
          start: { ch: 2, line: 0 },
          end: { ch: 6, line: 0 },
        },
      },
      {
        codeEditor: {
          value: "\n {{}}",
          cursor: { ch: 3, line: 1 },
          doc: ({
            getCursor: () => ({ ch: 3, line: 1 }),
            getLine: () => " {{}}",
            somethingSelected: () => false,
          } as unknown) as CodeMirror.Doc,
        },
        requestCallbackData: {
          completions: [{ name: "Api1" }],
          start: { ch: 2, line: 1 },
          end: { ch: 6, line: 1 },
        },
      },
    ];
    const expectedValues = [
      { ch: 2, line: 0 },
      { ch: 3, line: 1 },
    ];

    testCases.forEach((testCase, index) => {
      MockCodemirrorEditor.getValue.mockReturnValueOnce(
        testCase.codeEditor.value,
      );
      MockCodemirrorEditor.getCursor.mockReturnValueOnce(
        testCase.codeEditor.cursor,
      );
      MockCodemirrorEditor.getDoc.mockReturnValueOnce(testCase.codeEditor.doc);

      const value: any = ternServer.requestCallback(
        null,
        testCase.requestCallbackData,
        (MockCodemirrorEditor as unknown) as CodeMirror.Editor,
        () => null,
      );

      expect(value.from).toEqual(expectedValues[index]);
    });
  });
});
