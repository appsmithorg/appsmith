import React from "react";
import { EditableName } from "./EditableName";
import { render } from "test/testUtils";
import "@testing-library/jest-dom";
import { Icon } from "@appsmith/ads";
import { useEditableText } from "@appsmith/ads";

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  useEditableText: jest.fn(),
}));

describe("EditableName", () => {
  const mockOnNameSave = jest.fn();
  const mockOnExitEditing = jest.fn();
  const mockValidator = jest.fn();

  beforeEach(() => {
    (useEditableText as jest.Mock).mockReturnValue([
      { current: { focus: jest.fn() } },
      "test_name",
      mockValidator,
      jest.fn(),
      jest.fn(),
    ]);
  });

  const name = "test_name";
  const TabIcon = () => <Icon name="js" />;

  const setup = ({ isEditing = false, isLoading = false }) => {
    // Define the props
    const props = {
      name,
      icon: <TabIcon />,
      isEditing,
      onNameSave: mockOnNameSave,
      exitEditing: mockOnExitEditing,
      isLoading,
    };

    // Render the component
    const utils = render(<EditableName {...props} />);

    return {
      ...props,
      ...utils,
    };
  };

  test("renders component", () => {
    const utils = setup({});
    const editableNameElement = utils.getByText(utils.name);

    expect(editableNameElement).toBeInTheDocument();
    expect(editableNameElement.textContent).toBe(name);
  });

  test("renders input when editing", () => {
    const utils = setup({ isEditing: true });

    const editableNameElement = utils.queryByText(utils.name);

    expect(editableNameElement).not.toBeInTheDocument();

    const inputElement = utils.getByRole("textbox");

    expect(inputElement).toBeInTheDocument();
  });
});
