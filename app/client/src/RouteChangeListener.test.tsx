import React from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { Router } from "react-router";
import configureStore from "redux-mock-store";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import history from "utils/history";
import RouteChangeListener from "./RouteChangeListener";

const mockStore = configureStore([]);

const renderListener = () => {
  const store = mockStore({});

  const utils = render(
    <Provider store={store}>
      <Router history={history}>
        <RouteChangeListener />
      </Router>
    </Provider>,
  );

  return { store, ...utils };
};

const popActions = (store: ReturnType<typeof mockStore>) =>
  store
    .getActions()
    .filter((a) => a.type === ReduxActionTypes.BROWSER_HISTORY_POPPED);

describe("RouteChangeListener", () => {
  afterEach(() => {
    // Tests share the app history singleton; leave a known entry on top.
    history.push("/");
  });

  it("dispatches BROWSER_HISTORY_POPPED when the browser navigates back", async () => {
    const { store } = renderListener();

    history.push("/app/test/page-1?id=A");
    history.push("/app/test/page-1?id=B");

    expect(popActions(store)).toHaveLength(0);

    history.goBack();

    await waitFor(() => expect(popActions(store)).toHaveLength(1));
  });

  it("does not dispatch BROWSER_HISTORY_POPPED when Back changes the pathname", async () => {
    const { store } = renderListener();

    history.push("/app/test/page-1?id=A");
    history.push("/app/test/page-2?id=A");

    history.goBack();

    await waitFor(() =>
      expect(history.location.pathname).toBe("/app/test/page-1"),
    );
    expect(popActions(store)).toHaveLength(0);
  });

  it("does not dispatch BROWSER_HISTORY_POPPED for a programmatic push", async () => {
    const { store } = renderListener();

    history.push("/app/test/page-1?id=C");

    await waitFor(() => expect(history.location.search).toBe("?id=C"));
    expect(popActions(store)).toHaveLength(0);
  });

  it("stops listening after unmount", async () => {
    const { store, unmount } = renderListener();

    history.push("/app/test/page-1?id=D");
    history.push("/app/test/page-1?id=E");
    unmount();

    history.goBack();

    // history v4 stops tracking popstate once it has no listeners, so read the browser location directly
    await waitFor(() => expect(window.location.search).toBe("?id=D"));
    expect(popActions(store)).toHaveLength(0);
  });
});
