import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import { lightTheme } from "selectors/themeSelectors";
import AppsmithAIDeprecationCallout from "./AppsmithAIDeprecationCallout";
import {
  APPSMITH_AI_DEPRECATION_LEARN_MORE,
  APPSMITH_AI_KILL_DATE,
  createMessage,
} from "ee/constants/messages";

const renderCallout = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <Router>
        <AppsmithAIDeprecationCallout />
      </Router>
    </ThemeProvider>,
  );

describe("AppsmithAIDeprecationCallout", () => {
  it("renders the deprecation message with the kill date", () => {
    renderCallout();

    expect(
      screen.getByTestId("t--appsmith-ai-deprecation-callout"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Appsmith AI is deprecated/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(APPSMITH_AI_KILL_DATE)),
    ).toBeInTheDocument();
  });

  it("renders the migration docs link", () => {
    renderCallout();

    expect(
      screen.getByText(createMessage(APPSMITH_AI_DEPRECATION_LEARN_MORE)),
    ).toBeInTheDocument();
  });
});
