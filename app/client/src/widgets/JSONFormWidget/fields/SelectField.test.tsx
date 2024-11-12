import { act, render } from "@testing-library/react";
import { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DataType, FieldType, type Schema } from "../constants";
import FormContext from "../FormContext";
import type { SelectFieldProps } from "./SelectField";
import SelectField, { isValid } from "./SelectField";

describe(".isValid", () => {
  it("returns true when isRequired is false", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: 0, expectedOutput: true },
      { value: 1, expectedOutput: true },
      { value: -1, expectedOutput: true },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: false,
    } as SelectFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("returns true when isRequired is true and value is valid", () => {
    const inputs = [
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: 0, expectedOutput: true },
      { value: 1, expectedOutput: true },
      { value: -1, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: true,
    } as SelectFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("returns false when isRequired is true and value is invalid", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      isRequired: true,
    } as SelectFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });
});

describe("ResizeObserver", () => {
  const MockFormWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm();

    return (
      <FormProvider {...methods}>
        <FormContext.Provider
          value={{
            executeAction: jest.fn(),
            renderMode: RenderModes.CANVAS,
            setMetaInternalFieldState: jest.fn(),
            updateWidgetMetaProperty: jest.fn(),
            updateWidgetProperty: jest.fn(),
            updateFormData: jest.fn(),
          }}
        >
          {children}
        </FormContext.Provider>
      </FormProvider>
    );
  };
  const defaultProps: SelectFieldProps = {
    name: "testSelect",
    fieldClassName: "test-select",
    propertyPath: "testSelect",
    schemaItem: {
      fieldType: FieldType.SELECT,
      isRequired: false,
      isVisible: true,
      isDisabled: false,
      accessor: "testSelect",
      identifier: "testSelect",
      originalIdentifier: "testSelect",
      position: 0,
      label: "Test Select",
      options: [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
      ],
      children: {} as Schema, // Assuming an empty Schema object or placeholder
      dataType: DataType.STRING,
      isCustomField: false,
      sourceData: null, // Assuming sourceData as null or other default
      isFilterable: false,
      filterText: "",
      serverSideFiltering: false,
    },
  };
  let resizeObserver: ResizeObserverMock;

  beforeAll(() => {
    (
      global as unknown as { ResizeObserver: typeof ResizeObserverMock }
    ).ResizeObserver = ResizeObserverMock;
  });

  afterAll(() => {
    delete (global as unknown as { ResizeObserver?: typeof ResizeObserverMock })
      .ResizeObserver;
  });

  beforeEach(() => {
    // Capture the ResizeObserver instance
    resizeObserver = null!;
    (
      global as unknown as { ResizeObserver: typeof ResizeObserverMock }
    ).ResizeObserver = class extends ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        super(callback);
        resizeObserver = this as ResizeObserverMock;
      }
    };
  });

  it("should setup ResizeObserver on mount", () => {
    const mockObserver = jest.fn();

    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: mockObserver,
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }));
    render(
      <MockFormWrapper>
        <SelectField {...defaultProps} />
      </MockFormWrapper>,
    );

    expect(mockObserver).toHaveBeenCalled();
  });

  it("should cleanup ResizeObserver on unmount", () => {
    const { unmount } = render(
      <MockFormWrapper>
        <SelectField {...defaultProps} />
      </MockFormWrapper>,
    );

    const disconnectSpy = jest.spyOn(resizeObserver, "disconnect");

    // Unmount component
    unmount();

    // Verify cleanup
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("initializes with correct width", () => {
    // Mock offsetWidth
    const mockOffsetWidth = 200;

    jest
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockImplementation(() => mockOffsetWidth);

    const { getByTestId } = render(
      <MockFormWrapper>
        <SelectField {...defaultProps} />
      </MockFormWrapper>,
    );
    const content = getByTestId("select-container");

    expect(content.offsetWidth).toBe(mockOffsetWidth);
  });

  it("updates width when select component is resized", async () => {
    const widths = [200, 300, 400, 250];

    jest
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockImplementation(() => widths[0]);

    const { getByTestId } = render(
      <MockFormWrapper>
        <SelectField {...defaultProps} />
      </MockFormWrapper>,
    );
    let triggerElement = getByTestId("select-container");

    widths.forEach((width, index) => {
      let newWidth = widths[index + 1];

      if (index === widths.length - 1) {
        newWidth = widths[0];
      }

      // Verify initial width
      expect(triggerElement.offsetWidth).toBe(width);

      // Update mock width
      jest
        .spyOn(HTMLElement.prototype, "offsetWidth", "get")
        .mockImplementation(() => newWidth);

      // Trigger resize
      act(() => {
        resizeObserver.triggerResize(triggerElement, newWidth);
      });

      // Verify updated width
      triggerElement = getByTestId("select-container");

      expect(triggerElement.offsetWidth).toBe(newWidth);
    });
  });
});

type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

class ResizeObserverMock implements ResizeObserver {
  private callback: ResizeObserverCallback;
  private elements: Set<Element>;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(element: Element): void {
    this.elements.add(element);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  // Utility method to trigger resize
  triggerResize(element: Element, width: number): void {
    if (this.elements.has(element)) {
      this.callback([
        {
          target: element,
          contentRect: {
            width,
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          },
          borderBoxSize: [{ inlineSize: width, blockSize: 0 }],
          contentBoxSize: [{ inlineSize: width, blockSize: 0 }],
          devicePixelContentBoxSize: [{ inlineSize: width, blockSize: 0 }],
        } as ResizeObserverEntry,
      ]);
    }
  }
}
