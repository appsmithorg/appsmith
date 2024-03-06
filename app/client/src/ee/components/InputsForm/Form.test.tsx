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

  it("should reset form on triggerReset true", () => {
    const onUpdateForm = jest.fn();
    const onResetComplete = jest.fn();

    const { rerender } = render(
      <Form defaultValues={{ name: "John" }} onUpdateForm={onUpdateForm}>
        <TestField name="name" />
      </Form>,
    );

    // Check the value of the field
    expect(screen.getByTestId("testField-name")).toHaveValue("John");
    expect(onUpdateForm).toBeCalledTimes(0);

    const updatedDefaultValues = {
      name: "Harry",
    };

    // Attempt reset by setting triggerReset to true
    rerender(
      <Form
        defaultValues={updatedDefaultValues}
        onResetComplete={onResetComplete}
        onUpdateForm={onUpdateForm}
        triggerReset
      >
        <TestField name="name" />
      </Form>,
    );

    // Check the value of the field
    expect(screen.getByTestId("testField-name")).toHaveValue("Harry");
    expect(onResetComplete).toBeCalledTimes(1);
    expect(onUpdateForm).toBeCalledTimes(0);

    // Attempt unsetting reset by setting triggerReset to false
    rerender(
      <Form
        defaultValues={updatedDefaultValues}
        onResetComplete={onResetComplete}
        onUpdateForm={onUpdateForm}
        triggerReset={false}
      >
        <TestField name="name" />
      </Form>,
    );

    // Check the value of the field to still remain the same
    expect(screen.getByTestId("testField-name")).toHaveValue("Harry");
    expect(onResetComplete).toBeCalledTimes(1);
    expect(onUpdateForm).toBeCalledTimes(0);

    jest.clearAllMocks();

    // Attempt to reset with different defaultValues structure
    const newDefaultValues = {
      age: 10,
    };

    rerender(
      <Form
        defaultValues={newDefaultValues}
        onResetComplete={onResetComplete}
        onUpdateForm={onUpdateForm}
        triggerReset
      >
        <TestField name="age" />
      </Form>,
    );

    // Check the value of the new field
    expect(screen.getByTestId("testField-age")).toHaveValue("10");
    // Check the value of the old field is removed
    expect(screen.queryByTestId("testField-name")).toBeNull();
    expect(onResetComplete).toBeCalledTimes(1);
    expect(onUpdateForm).toBeCalledTimes(0);

    // Attempt unsetting reset by setting triggerReset to false
    rerender(
      <Form
        defaultValues={updatedDefaultValues}
        onResetComplete={onResetComplete}
        onUpdateForm={onUpdateForm}
        triggerReset={false}
      >
        <TestField name="age" />
      </Form>,
    );

    // Check the value of the field to still remain the same
    expect(screen.getByTestId("testField-age")).toHaveValue("10");
    expect(onResetComplete).toBeCalledTimes(1);
    expect(onUpdateForm).toBeCalledTimes(0);
  });
});
