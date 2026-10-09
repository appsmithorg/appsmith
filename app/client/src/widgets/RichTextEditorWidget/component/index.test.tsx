import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import RichtextEditorComponent, {
  type RichtextEditorComponentProps,
} from "./index";

// TinyMCE reads window.matchMedia on import, which jsdom does not provide.
jest.mock("tinymce/tinymce", () => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    addListener: jest.fn(),
    removeEventListener: jest.fn(),
    removeListener: jest.fn(),
  });

  return jest.requireActual("tinymce/tinymce");
});

jest.mock("@tinymce/tinymce-react", () => ({
  Editor: () => <div data-testid="t--tinymce-editor" />,
}));

const renderRichTextEditor = (
  props: Partial<RichtextEditorComponentProps> = {},
) => {
  const defaultProps: RichtextEditorComponentProps = {
    borderRadius: "0px",
    compactMode: false,
    isDisabled: false,
    isDynamicHeightEnabled: false,
    isMarkdown: false,
    isToolbarHidden: false,
    labelText: "Description",
    onValueChange: jest.fn(),
    widgetId: "rte-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <RichtextEditorComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("RichtextEditorComponent required marker", () => {
  it("renders the required marker when isRequired is true", () => {
    renderRichTextEditor({ isRequired: true });

    expect(screen.getByLabelText("(required)")).toBeInTheDocument();
  });

  it("does not render the required marker when isRequired is false", () => {
    renderRichTextEditor({ isRequired: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
