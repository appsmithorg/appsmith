import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { useEditableText } from "./useEditableText";
import { fireEvent, render } from "@testing-library/react";
import { Text } from "../../..";

describe("useEditableText", () => {
  const mockExitEditing = jest.fn();
  const mockOnNameSave = jest.fn();
  const mockValidateName = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("initial state", () => {
    mockValidateName.mockReturnValueOnce(null);
    const { result } = renderHook(() =>
      useEditableText(
        false,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [inputRef, editableName, validationError] = result.current;

    expect(editableName).toBe("initial_name");
    expect(validationError).toBeNull();
    expect(inputRef.current).toBeNull();
  });

  test("handle name change", () => {
    mockValidateName.mockReturnValueOnce(null);
    const { result } = renderHook(() =>
      useEditableText(
        true,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [, , , , handleTitleChange] = result.current;

    act(() => {
      handleTitleChange({
        target: { value: "new_name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    const [, editableName, validationError] = result.current;

    expect(editableName).toBe("new_name");
    expect(validationError).toBeNull();
  });

  test("handle valid name save on Enter key", () => {
    mockValidateName.mockReturnValueOnce(null);

    const { result } = renderHook(() =>
      useEditableText(
        true,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [, , , handleKeyUp, handleTitleChange] = result.current;

    act(() => {
      handleTitleChange({
        target: { value: "new_name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      handleKeyUp({
        key: "Enter",
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(mockOnNameSave).toHaveBeenCalledWith("new_name");
    expect(mockExitEditing).toHaveBeenCalled();
  });

  test("handle invalid name save on Enter key", () => {
    mockValidateName.mockReturnValue("Invalid");

    const { result } = renderHook(() =>
      useEditableText(
        true,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [, , , handleKeyUp, handleTitleChange] = result.current;

    act(() => {
      handleTitleChange({
        target: { value: "invalid_name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      handleKeyUp({
        key: "Enter",
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(mockOnNameSave).not.toHaveBeenCalled();
    expect(mockExitEditing).toHaveBeenCalled();
  });

  test("handle exit without saving on Escape key", () => {
    const { result } = renderHook(() =>
      useEditableText(
        true,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [, , , handleKeyUp] = result.current;

    act(() => {
      handleKeyUp({ key: "Escape" } as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(mockExitEditing).toHaveBeenCalled();
    expect(mockOnNameSave).not.toHaveBeenCalled();
  });

  test("handle exit without saving on no change", () => {
    const { result } = renderHook(() =>
      useEditableText(
        true,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [, , , handleKeyUp] = result.current;

    act(() => {
      handleKeyUp({ key: "Enter" } as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(mockExitEditing).toHaveBeenCalled();
    expect(mockOnNameSave).not.toHaveBeenCalled();
  });

  test("handle focus out event", () => {
    mockValidateName.mockReturnValue(null);
    const { result } = renderHook(() =>
      useEditableText(
        true,
        "initial_name",
        mockExitEditing,
        mockValidateName,
        mockOnNameSave,
      ),
    );

    const [inputRef, , , , handleChange] = result.current;

    const inputProps = { onChange: handleChange };

    const TestComponent = () => {
      return (
        <Text inputProps={inputProps} inputRef={inputRef} isEditable>
          Text
        </Text>
      );
    };

    render(<TestComponent />);

    act(() => {
      handleChange({
        target: { value: "new_name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      if (inputRef.current) {
        fireEvent.focusOut(inputRef.current);
      }
    });

    expect(mockOnNameSave).toHaveBeenCalledWith("new_name");
    expect(mockExitEditing).toHaveBeenCalled();
  });
});
