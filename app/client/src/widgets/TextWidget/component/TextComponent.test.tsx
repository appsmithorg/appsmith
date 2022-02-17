import React from "react";
import configureStore from "redux-mock-store";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider, theme, dark } from "constants/DefaultTheme";
import TextComponent, { TextComponentProps } from ".";

const defaultProps: TextComponentProps = {
  text: `[
    {
      name: {
        common: "DR Congo",
        official: "Democratic Republic of the Congo",
        nativeName: {
          fra: {
            official: "République démocratique du Congo",
            common: "RD Congo",
          },
          kon: {
            official: "Repubilika ya Kongo Demokratiki",
            common: "Repubilika ya Kongo Demokratiki",
          },
          lin: {
            official: "Republiki ya Kongó Demokratiki",
            common: "Republiki ya Kongó Demokratiki",
          },
          lua: {
            official: "Ditunga dia Kongu wa Mungalaata",
            common: "Ditunga dia Kongu wa Mungalaata",
          },
          swa: {
            official: "Jamhuri ya Kidemokrasia ya Kongo",
            common: "Jamhuri ya Kidemokrasia ya Kongo",
          },
        },
      },
      tld: [".cd"],
      cca2: "CD",
      ccn3: "180",
      cca3: "COD",
      cioc: "COD",
      independent: true,
      status: "officially-assigned",
      unMember: true,
      currencies: {
        CDF: {
          name: "Congolese franc",
          symbol: "FC",
        },
      },
    },
  ]`,
  textAlign: "LEFT",
  ellipsize: true,
  fontSize: "PARAGRAPH",
  isLoading: false,
  shouldScroll: false,
  backgroundColor: "",
  textColor: "#231F20",
  fontStyle: "BOLD",
  disableLink: false,
  shouldTruncate: true,
  truncateButtonColor: "#FFC13D",
  bottomRow: 46,
  leftColumn: 20,
  height: 390,
  rightColumn: 54,
  topRow: 7,
  width: 557,
  widgetId: "3igworuyni",
};

const renderComponent = (props: TextComponentProps = defaultProps) =>
  render(<TextComponent {...props} />);

describe("Text Component", () => {
  it("should automatically render truncate large data", () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId("icon:showMore")).toBeTruthy();
  });
  it("should not truncate text if text length is less than what can fit in the widget", () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId("icon:showMore")).toBeFalsy();
  });
});
