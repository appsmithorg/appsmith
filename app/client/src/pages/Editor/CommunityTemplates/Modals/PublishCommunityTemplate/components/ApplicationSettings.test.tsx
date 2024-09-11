import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import ApplicationSettings from "./ApplicationSettings";

describe("<ApplicationSettings />", () => {
  const mockProps = {
    isForkable: false,
    isPublic: true,
    setIsForkable: jest.fn(),
    setIsPublic: jest.fn(),
  };

  const BaseComponentRender = () => <ApplicationSettings {...mockProps} />;

  it("renders ApplicationSettings correctly", () => {
    render(<BaseComponentRender />);
    expect(
      screen.getByTestId("t--community-template-app-settting-public-switch"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--community-template-app-settting-forkable-switch"),
    ).toBeInTheDocument();
  });

  it("displays the correct titles", () => {
    render(<BaseComponentRender />);
    const title = createMessage(
      COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.title,
    );
    const publicSetting = createMessage(
      COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.publicSetting,
    );
    const forkableSetting = createMessage(
      COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.forkableSetting,
    );
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(publicSetting)).toBeInTheDocument();
    expect(screen.getByText(forkableSetting)).toBeInTheDocument();
  });

  it("renders both switches as disabled", () => {
    render(<BaseComponentRender />);
    expect(
      screen.getByTestId("t--community-template-app-settting-public-switch"),
    ).toBeDisabled();
    expect(
      screen.getByTestId("t--community-template-app-settting-forkable-switch"),
    ).toBeDisabled();
  });
});
