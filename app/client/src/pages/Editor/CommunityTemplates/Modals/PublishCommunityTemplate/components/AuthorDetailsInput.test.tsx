import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import AuthorDetailsInput from "./AuthorDetailsInput";
import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";

describe("<AuthorDetailsInput />", () => {
  const mockProps = {
    authorEmail: "jd@test.com",
    authorName: "",
    disableEmail: false,
    disableName: false,
    setAuthorEmail: jest.fn(),
    setAuthorName: jest.fn(),
  };

  const BaseComponentRender = () => <AuthorDetailsInput {...mockProps} />;

  it("renders AuthorDetailsInput correctly", () => {
    render(<BaseComponentRender />);
    expect(
      screen.getByTestId("t--community-template-author-name-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--community-template-author-email-input"),
    ).toBeInTheDocument();
  });

  it("shows default Display name error message when rendered without authorName", () => {
    render(<BaseComponentRender />);
    expect(
      screen.getByText(
        createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails.nameRequiredError,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("displays the correct default email", () => {
    render(<BaseComponentRender />);
    expect(screen.getByDisplayValue(mockProps.authorEmail)).toBeInTheDocument();
  });

  it("renders the email input as disabled", () => {
    render(<AuthorDetailsInput {...mockProps} disableEmail />);
    expect(screen.getByDisplayValue(mockProps.authorEmail)).toBeDisabled();
  });

  it("displays the correct labels", () => {
    render(<BaseComponentRender />);
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("handles name input changes", () => {
    render(<BaseComponentRender />);
    const nameInput = screen.getByTestId(
      "t--community-template-author-name-input",
    );

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    expect(mockProps.setAuthorName).toHaveBeenCalledWith("John Doe");
  });
});
