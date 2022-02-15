import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import EditableText from "./EditableText";
import userEvent from "@testing-library/user-event";
import { EditInteractionKind, SavingState } from "./EditableTextSubComponent";
import { ThemeProvider } from "constants/DefaultTheme";
import { lightTheme } from "selectors/themeSelectors";

describe("<EditableText />", () => {
  it("should call onBlurEverytime on each and every blur", async () => {
    const handleBlur = jest.fn();
    const getTestComponent = () => (
      <ThemeProvider theme={lightTheme}>
        <EditableText
          defaultValue="Test"
          editInteractionKind={EditInteractionKind.SINGLE}
          onBlurEverytime={handleBlur}
          savingState={SavingState.NOT_STARTED}
        />
      </ThemeProvider>
    );
    const component = getTestComponent();
    const renderResult = render(component);
    const EditableTextElement = renderResult.container.firstElementChild;
    if (EditableTextElement) {
      userEvent.click(EditableTextElement);
      userEvent.tab();
      expect(handleBlur).toHaveBeenCalled();
    } else {
      throw new Error("Failed");
    }
  });
});
