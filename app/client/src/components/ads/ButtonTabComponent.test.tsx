import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
import ButtonTabComponent from "./ButtonTabComponent";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";

const options = [
  {
    icon: "BOLD_FONT",
    value: "BOLD",
  },
  {
    icon: "ITALICS_FONT",
    value: "ITALICS",
  },
  {
    icon: "UNDERLINE",
    value: "UNDERLINE",
  },
];

describe("<ButtonTabComponent />", () => {
  const getTestComponent = (
    handleOnSelect: any = undefined,
    values: Array<string> = [],
  ) => (
    <ThemeProvider theme={lightTheme}>
      <ButtonTabComponent
        options={options}
        selectButton={handleOnSelect}
        values={values}
      />
    </ThemeProvider>
  );

  it("passed value should be selected", () => {
    const firstItem = options[0];
    render(getTestComponent(noop, [firstItem.value]));

    expect(screen.getByRole("tab", { selected: true })).toHaveClass(
      `t--button-tab-${firstItem.value}`,
    );
  });
});

describe("<ButtonTabComponent /> - Keyboard Navigation", () => {
  const getTestComponent = (handleOnSelect: any = undefined) => (
    <ThemeProvider theme={lightTheme}>
      <ButtonTabComponent
        options={options}
        selectButton={handleOnSelect}
        values={[]}
      />
    </ThemeProvider>
  );

  it("Pressing tab should focus the component", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("tablist")).toHaveFocus();

    // Should focus first Item
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 0) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });
  });

  it("{ArrowRight} should focus the next item", () => {
    render(getTestComponent());
    userEvent.tab();

    userEvent.keyboard("{ArrowRight}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 1) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });

    // ArrowRight after the last item should focus the first item again
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 0) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });
  });

  it("{ArrowLeft} should focus the previous item", () => {
    render(getTestComponent());
    userEvent.tab();

    userEvent.keyboard("{ArrowLeft}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 2) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });

    userEvent.keyboard("{ArrowLeft}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 1) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });
  });

  it("{Enter} or ' ' should trigger click event for the focused item", () => {
    const handleClick = jest.fn();
    render(getTestComponent(handleClick));
    userEvent.tab();

    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenLastCalledWith(options[1].value);

    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(2);
    expect(handleClick).toHaveBeenLastCalledWith(options[2].value);
  });
});
