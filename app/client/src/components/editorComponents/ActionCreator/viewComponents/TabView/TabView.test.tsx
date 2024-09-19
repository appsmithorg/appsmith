import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { TabView } from "./index";
import type { TabViewProps } from "../../types";

describe("Tab View component", () => {
  const props: TabViewProps = {
    label: "Type",
    activeObj: {
      id: "page-name",
      text: "Page name",
      action: () => {
        return 1;
      },
    },
    switches: [
      {
        id: "page-name",
        text: "Page name",
        action: () => {
          return 1;
        },
      },
      {
        id: "url",
        text: "URL",
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        action: () => {},
      },
    ],
    value: "{{navigateTo('Page1', {}, 'SAME_WINDOW'}}",
  };

  test("Renders Tab view component correctly", () => {
    render(<TabView {...props} />);
    expect(screen.getByTestId("tabs-label")).toHaveTextContent("Type");
  });
});
