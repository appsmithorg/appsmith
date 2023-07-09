import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { TextView } from "./index";
import type { TextViewProps } from "../../types";

describe("Text view component", () => {
  const props: TextViewProps = {
    label: "Key",
    value: "{{storeValue(,'1')}}",
    get: () => {
      return "";
    },
    set: () => {
      return 1;
    },
    exampleText: "storeValue('a','1')",
  };
  test("Renders Text view component correctly", () => {
    render(<TextView {...props} />);
    expect(screen.getByTestId("text-view-label")).toHaveTextContent("Key");
  });
});
