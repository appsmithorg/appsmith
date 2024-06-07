import React from "react";
import { render } from "@testing-library/react";
import { merge } from "lodash";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import IDE from ".";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

const getMockStore = (override: Record<string, any> = {}) => {
  const slice = {
    ui: {
      applications: {
        currentApplication: {
          gitApplicationMetadata: {
            branchName: "main",
            remoteUrl: "remote-url",
          },
        },
      },
      editor: {
        isPreviewMode: false,
      },
      gitSync: {
        protectedBranches: ["main"],
      },
    },
  };
  const mockStore = configureStore([]);
  const newSlice = merge(slice, override);
  return mockStore({
    ...newSlice,
  });
};

jest.mock("./MainPane", () => () => <div />);
jest.mock("./LeftPane", () => () => <div />);
jest.mock("./RightPane", () => () => <div />);
jest.mock("./Sidebar", () => () => <div />);
jest.mock("components/BottomBar", () => () => <div />);

describe("Protected view for IDE", () => {
  it("should render the protected view for IDE", () => {
    const store = getMockStore();
    const { getByTestId } = render(
      <Provider store={store}>
        <BrowserRouter>
          <IDE />
        </BrowserRouter>
      </Provider>,
    );
    expect(getByTestId("t--git-protected-branch-callout")).toBeInTheDocument();
  });

  it("should not render the protected view if branch is not protected", () => {
    const store = getMockStore({
      ui: {
        applications: {
          currentApplication: {
            gitApplicationMetadata: {
              branchName: "branch-1",
            },
          },
        },
        gitSync: {
          protectedBranches: ["main"],
        },
      },
    });
    const { queryByTestId } = render(
      <Provider store={store}>
        <BrowserRouter>
          <IDE />
        </BrowserRouter>
      </Provider>,
    );
    expect(
      queryByTestId("t--git-protected-branch-callout"),
    ).not.toBeInTheDocument();
  });
});
