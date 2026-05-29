import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UpdatesModal } from "../ManualUpgrades";
import { ApplicationVersion } from "ee/actions/applicationActions";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

const mockStore = configureStore([]);

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

jest.mock("selectors/editorSelectors", () => ({
  getCurrentApplicationId: () => "app-id",
  getCurrentPageId: () => "page-id",
  selectApplicationVersion: () => ApplicationVersion.DEFAULT,
  selectURLSlugs: () => ({ applicationSlug: "app", pageSlug: "page" }),
}));

function renderUpdatesModal(descriptions: string[], disclaimerDesc: string) {
  const store = mockStore({});
  const updates = [
    {
      name: "Test Update",
      shortDesc: "Short desc",
      description: descriptions,
      version: ApplicationVersion.SLUG_URL,
      disclaimer: { desc: disclaimerDesc },
    },
  ];

  render(
    <Provider store={store}>
      <UpdatesModal
        applicationVersion={ApplicationVersion.DEFAULT}
        closeModal={jest.fn()}
        latestVersion={ApplicationVersion.SLUG_URL}
        showModal
        updates={updates}
      />
    </Provider>,
  );

  return document.body;
}

describe("UpdatesModal - XSS prevention", () => {
  it("renders safe HTML content in description list items", () => {
    const body = renderUpdatesModal(
      ["URLs will be <code>/app/my-app</code> formatted."],
      "Existing <strong>references</strong> may change.",
    );

    expect(body.querySelector("code")).toHaveTextContent("/app/my-app");
    expect(body.querySelector("strong")).toHaveTextContent("references");
  });

  it("does NOT render img elements with onerror handlers in descriptions", () => {
    const body = renderUpdatesModal(
      ['<img src=x onerror="alert(1)">Malicious'],
      "Safe disclaimer",
    );

    expect(body.querySelector("img[onerror]")).toBeNull();
  });

  it("does NOT render script tags in disclaimer desc", () => {
    const body = renderUpdatesModal(
      ["Safe description"],
      '<script>alert("xss")</script><b>Warning</b>',
    );

    expect(body.querySelectorAll("script")).toHaveLength(0);
  });
});
