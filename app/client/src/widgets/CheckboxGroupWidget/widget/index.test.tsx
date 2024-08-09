// eslint-disable-next-line
// @ts-nocheck
import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";
import CheckboxGroupWidget, { defaultSelectedValuesValidation } from "./";

describe("<CheckboxGroup />", () => {
  test("should return empty parsed array on null options", async () => {
    const result = defaultSelectedValuesValidation("", {
      options: null,
    });

    expect(result).toStrictEqual({ isValid: true, parsed: [] });
  });

  test("should return parsed array on valid single default option as string", async () => {
    const result = defaultSelectedValuesValidation("blue", {
      options: [
        {
          label: "blue",
          value: "blue",
        },
        {
          label: "green",
          value: "green",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: ["blue"] });
  });

  test("should return parsed array on multiple default options as string ", async () => {
    const result = defaultSelectedValuesValidation("blue,green", {
      options: [
        {
          label: "blue",
          value: "blue",
        },
        {
          label: "green",
          value: "green",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: ["blue", "green"] });
  });

  test("should return parsed array on multiple default options as array ", async () => {
    const result = defaultSelectedValuesValidation(`["blue"]`, {
      options: [
        {
          label: "blue",
          value: "blue",
        },
        {
          label: "green",
          value: "green",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: ["blue"] });
  });

  test("should return empty array when default value is not in options", async () => {
    const result = defaultSelectedValuesValidation(`["blue"]`, {
      options: [
        {
          label: "Apple",
          value: "1",
        },
        {
          label: "Orange",
          value: "2",
        },
      ],
    });

    expect(result).toStrictEqual({ isValid: true, parsed: [] });
  });

  test("should sets accent color to default color when accentColor prop is empty", () => {
    const DEFAULT_BACKGROUND_COLOR = "#50AF6C";
    const labels = [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ];
    const updateWidgetMetaProperty = jest.fn();

    render(
      <CheckboxGroupWidget
        accentColor=""
        options={labels}
        updateWidgetMetaProperty={updateWidgetMetaProperty}
        selectedValues={["BLUE"]}
      />,
    );

    const checkboxOne = document.querySelectorAll(".bp3-control-indicator")[0];
    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxOne).toHaveStyle(
      `background-color: ${DEFAULT_BACKGROUND_COLOR}`,
    );
  });
});
