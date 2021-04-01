import React, { FC, ReactElement } from "react";
import { render, RenderOptions, queries } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "../src/constants/DefaultTheme";
import store from "../src/store";
import { getCurrentThemeDetails } from "../src/selectors/themeSelectors";
import * as customQueries from "./customQueries";
import { MemoryRouter } from "react-router-dom";

const AllTheProviders: FC = ({ children }) => {
  const defaultTheme = getCurrentThemeDetails(store.getState());

  return (
    <MemoryRouter>
      <Provider store={store}>
        <ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>
      </Provider>
    </MemoryRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) =>
  render(ui, {
    wrapper: AllTheProviders,
    queries: { ...queries, ...customQueries },
    ...options,
  });

export * from "@testing-library/react";

export { customRender as render };
