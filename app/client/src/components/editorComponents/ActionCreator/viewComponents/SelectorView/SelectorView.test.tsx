import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import type { SelectorViewProps } from "../../types";
import { SelectorView } from "./index";

describe("Selector view component", () => {
  const props: SelectorViewProps = {
    options: [
      {
        label: "Page1",
        id: "632c1d6244562f5051a7f36b",
        value: "'Page1'",
      },
    ],
    label: "Choose page",
    value: "{{navigateTo('Page1', {}, 'SAME_WINDOW')}}",
    defaultText: "Select page",
    displayValue: "",
    get: () => {
      return 1;
    },
    set: () => {
      return 1;
    },
  };

  test("Renders selector view component correctly", () => {
    render(<SelectorView {...props} />);
    expect(screen.getByTestId("selector-view-label")).toHaveTextContent(
      "Choose page",
    );
  });
});
