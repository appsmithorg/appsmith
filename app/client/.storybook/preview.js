import React from 'react';
import { DefaultTheme, ThemeProvider } from "./configs";
import store from "../src/store";
import { Provider } from "react-redux";
import GlobalStyles from "../src/globalStyles/index";
import "../src/index.css";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  (Story) => (
    <Provider store={store}>
      <ThemeProvider theme={DefaultTheme}>
        <Story />
        <GlobalStyles />
      </ThemeProvider>
    </Provider>
  ),
];