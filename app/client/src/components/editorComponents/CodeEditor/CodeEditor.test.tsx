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

describe("CodeEditor", () => {
  it("should check EvaluatedValuePopup prop is false when EvaluatedValuePopup is passed false to codeditor", () => {
    const finalTheme = { ...theme, colors: { ...theme.colors, ...light } };

    const testRenderer = TestRenderer.create(
      <Provider store={store}>
        <ThemeProvider theme={finalTheme}>
          <CodeEditor
            input={{
              value: "",
              onChange: (
                event: React.ChangeEvent<HTMLTextAreaElement> | string,
              ) => {
                //
              },
            }}
            hideEvaluatedValue={false}
            additionalDynamicData={{}}
            mode={EditorModes.TEXT}
            theme={EditorTheme.LIGHT}
            size={EditorSize.COMPACT}
            tabBehaviour={TabBehaviour.INDENT}
          />
        </ThemeProvider>
      </Provider>,
    );
    const testInstance = testRenderer.root;

    expect(
      testInstance.findByType(EvaluatedValuePopup).props.hideEvaluatedValue,
    ).toBe(false);
  });

  it("should check EvaluatedValuePopup is true when EvaluatedValuePopup is passed true to codeditor", () => {
    const finalTheme = { ...theme, colors: { ...theme.colors, ...light } };

    const testRenderer = TestRenderer.create(
      <Provider store={store}>
        <ThemeProvider theme={finalTheme}>
          <CodeEditor
            input={{
              value: "",
              onChange: (
                event: React.ChangeEvent<HTMLTextAreaElement> | string,
              ) => {
                //
              },
            }}
            hideEvaluatedValue={true}
            additionalDynamicData={{}}
            mode={EditorModes.TEXT}
            theme={EditorTheme.LIGHT}
            size={EditorSize.COMPACT}
            tabBehaviour={TabBehaviour.INDENT}
          />
        </ThemeProvider>
      </Provider>,
    );
    const testInstance = testRenderer.root;

    expect(
      testInstance.findByType(EvaluatedValuePopup).props.hideEvaluatedValue,
    ).toBe(true);
  });
});
