import React from "react";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";

import SectionField from "./SectionField";
import { lightTheme } from "selectors/themeSelectors";

const mockHiddenField = jest.fn();
jest.mock("./HiddenField", () => (props: any) => {
  mockHiddenField(props);
  return <div data-testid="field" />;
});

const mockInputGroupField = jest.fn();
jest.mock("./InputGroupField", () => (props: any) => {
  mockInputGroupField(props);
  return <div data-testid="field" />;
});

function Wrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues: any;
}) {
  const formMethods = useForm({ defaultValues });

  return (
    <ThemeProvider theme={lightTheme}>
      <FormProvider {...formMethods}>{children}</FormProvider>
    </ThemeProvider>
  );
}

describe("SectionField", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with indexed names", () => {
    const defaultValues = {
      inputsForm: [
        {
          id: "xxx",
          sectionName: "section",
          children: [],
        },
      ],
    };
    render(
      <Wrapper defaultValues={defaultValues}>
        <SectionField name="testSection" />
      </Wrapper>,
    );

    screen.debug;

    expect(mockHiddenField).toBeCalledTimes(2);
    expect(mockHiddenField).toHaveBeenCalledWith({
      name: "testSection.0.id",
    });
    expect(mockHiddenField).toHaveBeenCalledWith({
      name: "testSection.0.sectionName",
    });
    expect(mockInputGroupField).toHaveBeenNthCalledWith(1, {
      name: "testSection.0.children",
    });
  });
});
