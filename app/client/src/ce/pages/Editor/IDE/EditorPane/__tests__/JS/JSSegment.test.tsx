import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { useJSAdd } from "../../JS/hooks";
import { Provider } from "react-redux";
import type { Store } from "redux";
import { createStore } from "redux";
import { updateCurrentPage } from "actions/pageActions";
import rootReducer from "ee/reducers";
import * as redux from "react-redux";

// Custom wrapper to provide any store to the provider
function getWrapper(store: Store): React.FC {
  return ({ children }: { children?: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

// Mock react-router-dom
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn().mockReturnValue({
    pathname: "/app/untitled-application-1/page1-1/edit/jsObjects",
  }),
}));

describe("JS Segment", () => {
  it("creates JS in the correct page", () => {
    const store = createStore(rootReducer, {
      entities: {
        pageList: {
          currentPageId: "1",
          pages: [],
        },
      },
    });
    const useDispatchSpy = jest.spyOn(redux, "useDispatch");
    const mockDispatchFn = jest.fn();
    useDispatchSpy.mockReturnValue(mockDispatchFn);
    const wrapper = getWrapper(store);

    const { result } = renderHook(() => useJSAdd(), { wrapper });

    expect(result.current).toBeDefined();

    act(() => {
      result.current.openAddJS();
    });

    expect(mockDispatchFn).toBeCalledWith({
      payload: {
        from: "ENTITY_EXPLORER",
        pageId: "1",
      },
      type: "CREATE_NEW_JS_ACTION",
    });

    // Update the current page
    act(() => {
      store.dispatch(updateCurrentPage("2"));
    });

    // Render the hook because state has changed
    act(() => {
      renderHook(() => useJSAdd(), { wrapper });
    });

    // Call the function now from a different page
    act(() => {
      result.current.openAddJS();
    });

    // Now the creation action should have the new page id
    expect(mockDispatchFn).toBeCalledWith({
      payload: {
        from: "ENTITY_EXPLORER",
        pageId: "2",
      },
      type: "CREATE_NEW_JS_ACTION",
    });
  });
});
