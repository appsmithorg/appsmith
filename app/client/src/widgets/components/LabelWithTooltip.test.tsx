import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import LabelWithTooltip, {  LabelWithTooltipProps } from "./LabelWithTooltip";
import { ThemeProvider } from "styled-components";
export const mockTheme = {
    fontSizes: {
      6: 14,  
    },
    colors: {
      mirage: "#1E2A38",
      grey8: "#B0BEC5",
      propertyPane: {
        jsIconBg: "#F0F0F0",  
      },
    },
  };

describe("<LabelWithTooltip/>", () => {
  const defaultProps: LabelWithTooltipProps = {
    compact: false,
    text: "Label", 
  };

  const renderComponent = (props: Partial<LabelWithTooltipProps> = {}) => {
    return render(<ThemeProvider theme={mockTheme}><LabelWithTooltip {...defaultProps} {...props} /></ThemeProvider>);
  };

  it("should renders the label with text", () => {
    renderComponent();
    const label = screen.getByText("Label");
    expect(label).toBeInTheDocument();
  });

  it("should displays help icon when helpText is provided", () => {
    renderComponent({ helpText: "Help Text" });
    const helpIcon = screen.getByTestId("label-container");
    expect(helpIcon).toBeInTheDocument();
  });

});
