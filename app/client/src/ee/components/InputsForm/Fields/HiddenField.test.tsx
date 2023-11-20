import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import "@testing-library/jest-dom";

import HiddenField from "./HiddenField";

function Wrapper({ children }: { children: React.ReactNode }) {
  const formMethods = useForm();

  return <FormProvider {...formMethods}>{children}</FormProvider>;
}

describe("HiddenField", () => {
  it("renders a hidden input with the default value", () => {
    render(
      <Wrapper>
        <HiddenField name="testName" />
      </Wrapper>,
    );

    const hiddenInput = screen.getByTestId("hiddenField-testName");

    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("value", "");
  });

  it("renders a hidden input with a generated value", () => {
    const generateValue = () => "generatedValue";
    render(
      <Wrapper>
        <HiddenField generateValue={generateValue} name="testName" />
      </Wrapper>,
    );

    const hiddenInput = screen.getByTestId("hiddenField-testName");
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("value", "generatedValue");
  });

  it("handles onChange event", () => {
    render(
      <Wrapper>
        <HiddenField name="testName" />
      </Wrapper>,
    );
    const hiddenInput = screen.getByTestId("hiddenField-testName");

    expect(hiddenInput).toHaveAttribute("value", "");

    // Simulate onChange event
    const onChangeSpy = jest.fn();
    hiddenInput.addEventListener("change", onChangeSpy);
    fireEvent.change(hiddenInput, { target: { value: "new value" } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(hiddenInput).toHaveAttribute("value", "new value");
  });
});
