import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { createStore } from "redux";
import type { AnyAction } from "redux";
import { reducer as formReducer } from "redux-form";
import type { FormStateMap } from "redux-form";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import Login from "pages/UserAuth/Login";
import {
  LOGIN_FORM_EMAIL_FIELD_NAME,
  LOGIN_FORM_NAME,
  LOGIN_FORM_PASSWORD_FIELD_NAME,
} from "ee/constants/forms";
import {
  createMessage,
  LOGIN_PAGE_ACCOUNT_ACTIVATION_NOTE,
} from "ee/constants/messages";

const storeState = {
  ...unitTestBaseMockStore,
  organization: {
    organizationConfiguration: {},
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    users: {
      loadingStates: {},
      list: [],
      users: [],
      error: "",
      currentUser: {
        name: "mockUser",
        email: "mockUser@gmail.com",
      },
      featureFlag: {
        data: {},
        isFetched: true,
        overriddenFlags: {},
      },
      productAlert: {
        config: {},
      },
    },
  },
};

const mockStore = configureStore([]);

const renderLoginAt = (search: string) => {
  const store = mockStore(storeState);
  const history = createMemoryHistory({
    initialEntries: [`/user/login${search}`],
  });
  const view = render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <Router history={history}>
          <Login />
        </Router>
      </ThemeProvider>
    </Provider>,
  );

  return { ...view, history, store };
};

const initializedEmails = (actions: AnyAction[]) =>
  actions
    .filter(
      (action) =>
        action.type === "@@redux-form/INITIALIZE" &&
        action.meta?.form === LOGIN_FORM_NAME,
    )
    .map((action) => action.payload?.[LOGIN_FORM_EMAIL_FIELD_NAME]);

// A store that runs the form reducer, so typed values reach the form state.
type LoginTestState = typeof storeState & { form?: FormStateMap };

const renderLoginWithFormStateAt = (search: string) => {
  const store = createStore((state: LoginTestState = storeState, action) => ({
    ...state,
    form: formReducer(state.form ?? {}, action),
  }));
  const history = createMemoryHistory({
    initialEntries: [`/user/login${search}`],
  });
  const view = render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <Router history={history}>
          <Login />
        </Router>
      </ThemeProvider>
    </Provider>,
  );

  return { ...view, store };
};

describe("Login page account activation", () => {
  it("shows the activation note when the link carries the activation marker", () => {
    const { getByText } = renderLoginAt(
      "?activation=true&email=invited%40example.com",
    );

    expect(
      getByText(createMessage(LOGIN_PAGE_ACCOUNT_ACTIVATION_NOTE)),
    ).toBeInTheDocument();
  });

  it("does not show the activation note on a plain login page", () => {
    const { queryByText } = renderLoginAt("");

    expect(
      queryByText(createMessage(LOGIN_PAGE_ACCOUNT_ACTIVATION_NOTE)),
    ).not.toBeInTheDocument();
  });

  it("starts the form with the invited email when the link carries the activation marker", () => {
    const { store } = renderLoginAt(
      "?activation=true&email=invited%40example.com",
    );

    expect(initializedEmails(store.getActions())).toEqual([
      "invited@example.com",
    ]);
  });

  it("leaves the form empty when the link has no activation marker", () => {
    const { store } = renderLoginAt("?email=invited%40example.com");

    expect(initializedEmails(store.getActions())).toEqual([]);
  });

  it("starts the form with the new email when the page moves to another invitation link", () => {
    const { history, store } = renderLoginAt(
      "?activation=true&email=first%40example.com",
    );

    act(() => {
      history.push("/user/login?activation=true&email=second%40example.com");
    });

    expect(initializedEmails(store.getActions())).toEqual([
      "first@example.com",
      "second@example.com",
    ]);
  });

  it("keeps the typed password when the page opens from an invitation link", () => {
    const { container, store } = renderLoginWithFormStateAt(
      "?activation=true&email=invited%40example.com",
    );
    const passwordInput = container.querySelector(
      `input[name="${LOGIN_FORM_PASSWORD_FIELD_NAME}"]`,
    ) as HTMLInputElement;

    act(() => {
      fireEvent.change(passwordInput, { target: { value: "typed-password" } });
    });

    const values = store.getState().form?.[LOGIN_FORM_NAME]?.values;

    expect(values?.[LOGIN_FORM_EMAIL_FIELD_NAME]).toBe("invited@example.com");
    expect(values?.[LOGIN_FORM_PASSWORD_FIELD_NAME]).toBe("typed-password");
  });
});
