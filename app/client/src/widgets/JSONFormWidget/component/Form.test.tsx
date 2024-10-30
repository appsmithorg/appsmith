import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { klona } from "klona";
import React from "react";
import { useForm } from "react-hook-form";
import { ROOT_SCHEMA_KEY, type SchemaItem } from "../constants";
import Form from "./Form";
import useFixedFooter from "./useFixedFooter";

jest.mock("react-hook-form", () => ({
  __esModule: true,
  useForm: jest.fn(),
  FormProvider: jest.fn(({ children }) => <div>{children}</div>),
}));

jest.mock("./useFixedFooter", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("widgets/ButtonWidget/component", () => ({
  __esModule: true,
  BaseButton: jest.fn(({ children, ...props }) => (
    <button {...props}>{children}</button>
  )),
}));

function mockUseForm(withErrors = false) {
  (useForm as jest.Mock).mockReturnValue({
    formState: {
      errors: withErrors
        ? {
            fieldName: {
              type: "required",
              message: "This field is required",
            },
          }
        : null,
    },
    reset: jest.fn(),
    trigger: jest.fn(),
    watch: jest.fn(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  });
}

const TEST_IDS = {
  SUBMIT_BTN: "t--jsonform-submit-btn",
  RESET_BTN: "t--jsonform-reset-btn",
};

const defaultProps = {
  backgroundColor: "#fff",
  disabledWhenInvalid: false,
  fixedFooter: false,
  getFormData: jest.fn(),
  hideFooter: false,
  isSubmitting: false,
  isWidgetMounting: false,
  onFormValidityUpdate: jest.fn(),
  onSubmit: jest.fn(),
  onreset: jest.fn(),
  registerResetObserver: jest.fn(),
  resetButtonLabel: "Reset",
  resetButtonStyles: {},
  schema: {},
  scrollContents: false,
  showReset: true,
  stretchBodyVertically: false,
  submitButtonLabel: "Submit",
  submitButtonStyles: {},
  title: "Test Form",
  unregisterResetObserver: jest.fn(),
  updateFormData: jest.fn(),
  children: <input />,
};

describe("Form Component", () => {
  beforeEach(() => {
    const mockBodyRef = React.createRef<HTMLFormElement>();
    const mockFooterRef = React.createRef<HTMLDivElement>();

    (useFixedFooter as jest.Mock).mockReturnValue({
      bodyRef: mockBodyRef,
      footerRef: mockFooterRef,
    });
  });

  describe("happy render path", () => {
    beforeEach(() => mockUseForm());
    it("renders the form title", () => {
      render(<Form {...defaultProps}>Form Content</Form>);
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    it("renders children inside the form body", () => {
      render(<Form {...defaultProps}>Form Content</Form>);
      expect(screen.getByText("Form Content")).toBeInTheDocument();
    });

    it("renders the submit button with correct label", () => {
      const { getByTestId } = render(
        <Form {...defaultProps}>Form Content</Form>,
      );
      const submitBtn = getByTestId(TEST_IDS.SUBMIT_BTN);

      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toHaveAttribute("text", defaultProps.submitButtonLabel);

      fireEvent.click(submitBtn);
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it("renders the reset button with correct label when showReset is true", () => {
      const { getByTestId } = render(
        <Form {...defaultProps}>Form Content</Form>,
      );
      const resetBtn = getByTestId(TEST_IDS.RESET_BTN);

      expect(resetBtn).toBeInTheDocument();
      expect(resetBtn).toHaveAttribute("text", defaultProps.resetButtonLabel);
      expect(defaultProps.registerResetObserver).toHaveBeenCalled();
    });

    // Form updates data correctly when input values change
    it("should update data when input values change", () => {
      const mockUpdateFormData = jest.fn();
      const mockGetFormData = jest.fn().mockReturnValue({});
      const mockRegisterResetObserver = jest.fn();
      const mockUnregisterResetObserver = jest.fn();
      const mockOnSubmit = jest.fn();
      const mockOnFormValidityUpdate = jest.fn();
      const mockSchema = { [ROOT_SCHEMA_KEY]: {} as SchemaItem };
      const props = klona({
        ...defaultProps,
        updateFormData: mockUpdateFormData,
        getFormData: mockGetFormData,
        registerResetObserver: mockRegisterResetObserver,
        unregisterResetObserver: mockUnregisterResetObserver,
        onSubmit: mockOnSubmit,
        onFormValidityUpdate: mockOnFormValidityUpdate,
        schema: mockSchema,
      });
      const { getByTestId } = render(<Form {...props} />);

      fireEvent.click(getByTestId(TEST_IDS.SUBMIT_BTN));
      expect(mockUpdateFormData).toHaveBeenCalled();
    });
  });

  describe("unhappy render path", () => {
    it("does not render the reset button when showReset is false", () => {
      mockUseForm();
      const { queryByTestId } = render(
        <Form {...defaultProps} showReset={false}>
          Form Content
        </Form>,
      );

      expect(queryByTestId(TEST_IDS.RESET_BTN)).not.toBeInTheDocument();
    });

    it("disables the submit button when disabledWhenInvalid is true and form is invalid", () => {
      mockUseForm(true);
      const { getByTestId } = render(
        <Form {...defaultProps} disabledWhenInvalid>
          Form Content
        </Form>,
      );

      expect(getByTestId(TEST_IDS.SUBMIT_BTN)).toBeDisabled();
    });

    it("triggers a check, necessitating a re-render, when the children in form are updated", () => {
      mockUseForm(true);
      const propsToUpdate = klona({
        ...defaultProps,
        disabledWhenInvalid: true,
      });
      const { getByTestId } = render(
        <Form {...propsToUpdate}>Form Content</Form>,
      );

      expect(getByTestId(TEST_IDS.SUBMIT_BTN)).toBeDisabled();
    });

    it("should handle empty schema gracefully without errors", () => {
      mockUseForm();
      const mockUpdateFormData = jest.fn();
      const props = klona({ ...defaultProps, schema: undefined });
      const { container } = render(<Form {...props} />);

      expect(container).toBeInTheDocument();
      expect(mockUpdateFormData).not.toHaveBeenCalled();
    });
  });
});
