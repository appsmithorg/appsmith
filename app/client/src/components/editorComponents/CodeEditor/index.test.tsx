import React from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";
import store from "store";
import CodeEditor from "./index";
import {
  EditorSize,
  EditorTheme,
  TabBehaviour,
  EditorModes,
} from "./EditorConfig";

describe("<CodeEditor /> - Keyboard navigation", () => {
  // To avoid warning "Error: Not implemented: window.focus"
  window.focus = jest.fn();

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTestComponent = (handleOnSelect: any = undefined) => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CodeEditor
          additionalDynamicData={{}}
          hideEvaluatedValue={false}
          input={{
            value: "",
            onChange: handleOnSelect,
          }}
          mode={EditorModes.TEXT}
          size={EditorSize.COMPACT}
          tabBehaviour={TabBehaviour.INDENT}
          theme={EditorTheme.LIGHT}
        />
      </ThemeProvider>
    </Provider>
  );

  it("Pressing tab should focus the component", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByTestId("code-editor-target")).toHaveFocus();
  });
});
