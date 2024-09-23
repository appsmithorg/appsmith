import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import CommunityTemplatesPublishInfo from "./CommunityTemplatesPublishInfo";
import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";

const mockStore = configureStore();

describe("<CommunityTemplatesPublishInfo />", () => {
  beforeEach(() => {
    const store = mockStore({});

    store.clearActions();
  });

  it("renders UnPublishedAppInstructions correctly when app is not published", () => {
    const store = mockStore({
      ui: {
        applications: {
          currentApplication: {
            isCommunityTemplate: false,
            id: "123",
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <CommunityTemplatesPublishInfo
          onPublishClick={() => {}}
          setShowHostModal={() => {}}
        />
      </Provider>,
    );
    expect(
      screen.getByText(
        createMessage(COMMUNITY_TEMPLATES.modals.unpublishedInfo.title),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(COMMUNITY_TEMPLATES.modals.unpublishedInfo.description),
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("t--Publish-Initiate")).toBeInTheDocument();
  });

  it("renders PublishedAppInstructions correctly when app is published", () => {
    const store = mockStore({
      ui: {
        applications: {
          currentApplication: {
            isCommunityTemplate: true,
            id: "123",
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <CommunityTemplatesPublishInfo
          onPublishClick={() => {}}
          setShowHostModal={() => {}}
        />
      </Provider>,
    );
    expect(
      screen.getByText(
        createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.title),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.description),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.viewTemplate),
      ),
    ).toBeInTheDocument();
  });

  it("handles clicking on 'View Template' button", () => {
    // Mock the utility function for opening URLs
    const mockOpenUrlInNewPage = jest.fn();

    jest.spyOn(window, "open").mockImplementation(mockOpenUrlInNewPage);
    const store = mockStore({
      ui: {
        applications: {
          currentApplication: {
            isCommunityTemplate: true,
            id: "123",
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <CommunityTemplatesPublishInfo
          onPublishClick={() => {}}
          setShowHostModal={() => {}}
        />
      </Provider>,
    );
    fireEvent.click(
      screen.getByText(
        createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.viewTemplate),
      ),
    );
    expect(mockOpenUrlInNewPage).toHaveBeenCalledWith(
      expect.stringMatching(/\/template\/\d+/),
      "_blank",
    );
  });

  it("handles clicking on 'Publish' button", () => {
    const mockOnPublishClick = jest.fn();
    const store = mockStore({
      ui: {
        applications: {
          currentApplication: {
            isCommunityTemplate: false,
            id: "123",
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <CommunityTemplatesPublishInfo
          onPublishClick={mockOnPublishClick}
          setShowHostModal={() => {}}
        />
      </Provider>,
    );
    fireEvent.click(screen.getByTestId("t--Publish-Initiate"));
    expect(mockOnPublishClick).toHaveBeenCalled();
  });
});
