import React from "react";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
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

  it("Pressing tab should focus the component", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByTestId("code-editor-target")).toHaveFocus();
  });

  it("Pressing {Enter} once in focus should make the input editable", () => {
    const handleOnSelect = jest.fn();
    const { container } = render(getTestComponent(handleOnSelect));
    userEvent.tab();
    expect(screen.getByTestId("code-editor-target")).toHaveFocus();

    // Typing should not work unless {Enter} is pressed
    userEvent.keyboard("abcd");
    expect(
      (container?.querySelector(".CodeMirror textarea") as HTMLTextAreaElement)
        ?.value,
    ).not.toStrictEqual("abcd");

    userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("code-editor-target")).not.toHaveFocus();
    userEvent.keyboard("abcd");
    expect(
      (container?.querySelector(".CodeMirror textarea") as HTMLTextAreaElement)
        ?.value,
    ).toStrictEqual("abcd");
  });

  it("Pressing {Space} once in focus should make the input editable", () => {
    const handleOnSelect = jest.fn();
    const { container } = render(getTestComponent(handleOnSelect));
    userEvent.tab();
    expect(screen.getByTestId("code-editor-target")).toHaveFocus();

    // Typing should not work unless {Enter} is pressed
    userEvent.keyboard("abcd");
    expect(
      (container?.querySelector(".CodeMirror textarea") as HTMLTextAreaElement)
        ?.value,
    ).not.toStrictEqual("abcd");

    userEvent.keyboard(" ");
    expect(screen.getByTestId("code-editor-target")).not.toHaveFocus();
    userEvent.keyboard("abcd");
    expect(
      (container?.querySelector(".CodeMirror textarea") as HTMLTextAreaElement)
        ?.value,
    ).toStrictEqual("abcd");
  });

  it("Pressing {Escape} once in edit mode should make the input not editable", () => {
    const handleOnSelect = jest.fn();
    const { container } = render(getTestComponent(handleOnSelect));
    userEvent.tab();
    expect(screen.getByTestId("code-editor-target")).toHaveFocus();

    userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("code-editor-target")).not.toHaveFocus();

    userEvent.keyboard("{Escape}");
    expect(screen.getByTestId("code-editor-target")).toHaveFocus();

    // Typing should not work unless {Enter} is pressed
    userEvent.keyboard("abcd");
    expect(
      (container?.querySelector(".CodeMirror textarea") as HTMLTextAreaElement)
        ?.value,
    ).not.toStrictEqual("abcd");
  });
});
