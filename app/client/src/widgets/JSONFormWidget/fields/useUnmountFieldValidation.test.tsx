import { renderHook } from "@testing-library/react-hooks";
import { useFormContext } from "react-hook-form";
import useUnmountFieldValidation from "./useUnmountFieldValidation";
import { startAndEndSpanForFn } from "UITelemetry/generateTraces";

// Mock dependencies
jest.mock("react-hook-form", () => ({
  useFormContext: jest.fn(),
}));

jest.mock("UITelemetry/generateTraces", () => ({
  startAndEndSpanForFn: jest.fn((name, options, fn) => fn()),
}));

describe("useUnmountFieldValidation", () => {
  const mockTrigger = jest.fn();

  beforeEach(() => {
    (useFormContext as jest.Mock).mockReturnValue({
      trigger: mockTrigger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger validation on unmount", () => {
    const fieldName = "testField";
    const { unmount } = renderHook(() =>
      useUnmountFieldValidation({ fieldName }),
    );

    // Verify trigger hasn't been called yet
    expect(mockTrigger).not.toHaveBeenCalled();
    expect(startAndEndSpanForFn).not.toHaveBeenCalled();

    // Unmount the hook
    unmount();

    // Verify trigger was called with correct field name
    expect(startAndEndSpanForFn).toHaveBeenCalledWith(
      "JSONFormWidget.triggerFieldValidation",
      {},
      expect.any(Function),
    );
    expect(mockTrigger).toHaveBeenCalledWith(fieldName);
  });

  it("should update cleanup when fieldName changes", () => {
    const { rerender, unmount } = renderHook(
      ({ fieldName }) => useUnmountFieldValidation({ fieldName }),
      {
        initialProps: { fieldName: "field1" },
      },
    );

    // Change the field name
    rerender({ fieldName: "field2" });
    unmount();

    // Should trigger validation for the latest field name
    expect(mockTrigger).toHaveBeenCalledWith("field2");
  });
});
