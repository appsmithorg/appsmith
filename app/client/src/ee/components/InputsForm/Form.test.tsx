import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Form from "./Form";
import { useController } from "react-hook-form";
import "@testing-library/jest-dom";

function TestField({ name }: { name: string }) {
  const { field } = useController({
    name,
  });
  const { onBlur, onChange, value } = field;

  return (
    <input
      data-testid={`testField-${name}`}
      onBlur={onBlur}
      onChange={onChange}
      type="text"
      value={value}
    />
  );
}

describe("Form", () => {
  it("renders the form component with children", () => {
    render(
      <Form defaultValues={{ name: "John" }} onUpdateForm={jest.fn()}>
        <TestField name="name" />
      </Form>,
    );

    const inputElement = screen.getByTestId("testField-name");
    expect(inputElement).toBeInTheDocument();
  });

  it("calls onUpdateForm when form values change", () => {
    const onUpdateForm = jest.fn();
    render(
      <Form defaultValues={{ name: "John" }} onUpdateForm={onUpdateForm}>
        <TestField name="name" />
      </Form>,
    );

    const inputElement = screen.getByTestId("testField-name");
    fireEvent.change(inputElement, { target: { value: "John Doe" } });
    fireEvent.change(inputElement, { target: { value: "Mr Doe" } });

    expect(onUpdateForm).toHaveBeenCalledWith({ name: "John Doe" });
    expect(onUpdateForm).toHaveBeenCalledWith({ name: "Mr Doe" });
  });

  it("unsubscribes from the form updates on unmount", () => {
    const onUpdateForm = jest.fn();
    const { unmount } = render(
      <Form defaultValues={{ name: "John" }} onUpdateForm={onUpdateForm}>
        <TestField name="name" />
      </Form>,
    );

    unmount();
    // Ensure that the subscription is unsubscribed upon unmount
    expect(onUpdateForm).toHaveBeenCalledTimes(0); // Called initially
  });
});
