import CodeEditor from "./index";
import store from "store";
import TestRenderer from "react-test-renderer";
import React from "react";
import { Provider } from "react-redux";
import EvaluatedValuePopup from "./EvaluatedValuePopup";
import { ThemeProvider } from "styled-components";
import { theme, light } from "constants/DefaultTheme";
import {
  EditorSize,
  EditorTheme,
  TabBehaviour,
  EditorModes,
} from "./EditorConfig";
import { render } from "@testing-library/react";

describe("CodeEditor", () => {
  it("should check EvaluatedValuePopup's hideEvaluatedValue  is false when hideEvaluatedValue is passed as false to codeditor", () => {
    const finalTheme = { ...theme, colors: { ...theme.colors, ...light } };
    const testRenderer = TestRenderer.create(
      <Provider store={store}>
        <ThemeProvider theme={finalTheme}>
          <CodeEditor
            additionalDynamicData={{}}
            hideEvaluatedValue={false}
            input={{
              value: "",
              onChange: () => {
                //
              },
            }}
            mode={EditorModes.TEXT}
            size={EditorSize.COMPACT}
            tabBehaviour={TabBehaviour.INDENT}
            theme={EditorTheme.LIGHT}
          />
        </ThemeProvider>
      </Provider>,
    );
    const testInstance = testRenderer.root;
    expect(
      testInstance.findByType(EvaluatedValuePopup).props.hideEvaluatedValue,
    ).toBe(false);
  });

  it("should check EvaluatedValuePopup's hideEvaluatedValue is true when hideEvaluatedValue is passed as true to codeditor", () => {
    const finalTheme = { ...theme, colors: { ...theme.colors, ...light } };
    const testRenderer = TestRenderer.create(
      <Provider store={store}>
        <ThemeProvider theme={finalTheme}>
          <CodeEditor
            additionalDynamicData={{}}
            hideEvaluatedValue
            input={{
              value: "",
              onChange: () => {
                //
              },
            }}
            mode={EditorModes.TEXT}
            size={EditorSize.COMPACT}
            tabBehaviour={TabBehaviour.INDENT}
            theme={EditorTheme.LIGHT}
          />
        </ThemeProvider>
      </Provider>,
    );
    const testInstance = testRenderer.root;
    expect(
      testInstance.findByType(EvaluatedValuePopup).props.hideEvaluatedValue,
    ).toBe(true);
  });
  it("Should highlight the current line", async () => {
    const finalTheme = { ...theme, colors: { ...theme.colors, ...light } };
    const component = render(
      <Provider store={store}>
        <ThemeProvider theme={finalTheme}>
          <CodeEditor
            additionalDynamicData={{}}
            hideEvaluatedValue
            input={{
              value: `export default {
                myFun1: () => {}
              }`,
              onChange: () => {
                //
              },
            }}
            mode={EditorModes.TEXT}
            size={EditorSize.COMPACT}
            tabBehaviour={TabBehaviour.INDENT}
            theme={EditorTheme.LIGHT}
          />
        </ThemeProvider>
      </Provider>,
    );
    const line1 = component.container.querySelector(".CodeMirror-line");
    expect(line1).toBeDefined();
    (line1 as HTMLSpanElement)?.click();
    const highlight = component.container.querySelector(
      ".CodeMirror-activeline-background",
    );
    expect(highlight).toBeDefined();
  });
});
