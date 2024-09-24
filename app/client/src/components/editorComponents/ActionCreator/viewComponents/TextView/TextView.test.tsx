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

  const propsQueryParams = {
    dataTreePath: "Button1.onClick",
    exampleText: "navigateTo('Page1', { a: 1 }, 'SAME_WINDOW')",
    get: () => {
      return "";
    },
    set: () => {
      return 1;
    },
    isValueChanged: () => {
      return false;
    },
    label: "Query params",
    value: "{{navigateTo('', {}, 'SAME_WINDOW');}}",
  };

  test("Renders Text view with Query Params field collapsed for navigateTo action", () => {
    render(<TextView {...propsQueryParams} />);
    const queryParamsBody =
      screen.getByText("Query params").parentNode?.nextSibling;

    expect(queryParamsBody).toHaveStyle({ display: "none" });
  });

  test("Renders Text view with Query Params field expanded for navigateTo action", () => {
    propsQueryParams.isValueChanged = () => true;
    render(<TextView {...propsQueryParams} />);
    const queryParamsBodyUpdated =
      screen.getByText("Query params").parentNode?.nextSibling;

    expect(queryParamsBodyUpdated).toHaveStyle({ display: "flex" });
  });

  const propsParams = {
    dataTreePath: "Button1.onClick",
    exampleText: "Api1.run({ a: 1 })",
    get: () => {
      return "";
    },
    set: () => {
      return 1;
    },
    isValueChanged: () => {
      return false;
    },
    label: "Params",
    value: "{{Api1.run();}}",
  };

  test("Renders Text view with Params field collapsed for Query action selected", () => {
    render(<TextView {...propsParams} />);
    const queryParamsBody = screen.getByText("Params").parentNode?.nextSibling;

    expect(queryParamsBody).toHaveStyle({ display: "none" });
  });
  test("Renders Text view with Params field expanded for Query action selected", () => {
    propsParams.isValueChanged = () => true;

    render(<TextView {...propsParams} />);
    const queryParamsBodyUpdated =
      screen.getByText("Params").parentNode?.nextSibling;

    expect(queryParamsBodyUpdated).toHaveStyle({ display: "flex" });
  });
});
