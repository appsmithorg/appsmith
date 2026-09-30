import React from "react";
import "jest-styled-components";
import { act, fireEvent } from "@testing-library/react";
import store from "store";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { render } from "test/testUtils";
import { ApplicationCard } from "./ApplicationCard";
import type { ApplicationPayload } from "entities/Application";

// utils/history is the navigation seam; the card must render without a router.
jest.mock("utils/history", () => ({
  __esModule: true,
  default: {
    push: jest.fn(),
    listen: jest.fn(),
    location: { pathname: "/" },
  },
}));

// Storage read inside an effect — keep it deterministic and async-free.
jest.mock("utils/storage", () => ({
  getLatestGitBranchFromLocal: jest.fn().mockResolvedValue(undefined),
}));

function buildApplication(
  overrides: Partial<ApplicationPayload> = {},
): ApplicationPayload {
  return {
    id: "app-1",
    baseId: "base-app-1",
    name: "Sample App",
    workspaceId: "ws-1",
    isPublic: false,
    appIsExample: false,
    slug: "sample-app",
    userPermissions: ["read:applications", "manage:applications"],
    pages: [],
    ...overrides,
  } as unknown as ApplicationPayload;
}

const baseProps = {
  workspaceId: "ws-1",
  isFetchingApplications: false,
  permissions: {
    hasCreateNewApplicationPermission: true,
    hasManageWorkspacePermissions: true,
    canInviteToWorkspace: true,
  },
};

describe("ApplicationCard — description subtitle", () => {
  it("renders the description under the app name when set", () => {
    const app = buildApplication({
      name: "AUD-IA UAT FUAA (AUDITOR)",
      description: "Internal audit UAT for the FUAA auditor role",
    });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} />,
    );

    expect(getByTestId("t--app-card-name").textContent).toBe(
      "AUD-IA UAT FUAA (AUDITOR)",
    );
    expect(getByTestId("t--app-card-description").textContent).toBe(
      "Internal audit UAT for the FUAA auditor role",
    );
  });

  it("renders no description element when the app has none", () => {
    const { queryByTestId } = render(
      <ApplicationCard {...baseProps} application={buildApplication()} />,
    );

    expect(queryByTestId("t--app-card-description")).toBeNull();
  });

  it("lets an editor change the description from the card menu", () => {
    const update = jest.fn();
    const app = buildApplication({ description: "Old blurb" });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} update={update} />,
    );

    const trigger = getByTestId("t--application-card-context-menu");

    // Radix opens the menu on keyboard activation in jsdom.
    fireEvent.keyDown(trigger, { key: "Enter" });

    const field = document.querySelector(
      ".t--application-description",
    ) as HTMLElement;

    expect(field).toBeTruthy();
    expect(field.textContent).toContain("Old blurb");

    fireEvent.click(field);
    const input = document.querySelector(
      ".t--application-description textarea",
    ) as HTMLTextAreaElement;

    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: "  New blurb  " } });
    fireEvent.blur(input);

    expect(update).toHaveBeenCalledWith("app-1", { description: "New blurb" });
  });

  it("clears the description from the card menu with a single empty save", () => {
    const update = jest.fn();
    const app = buildApplication({ description: "Old blurb" });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} update={update} />,
    );

    const trigger = getByTestId("t--application-card-context-menu");

    fireEvent.keyDown(trigger, { key: "Enter" });

    const field = document.querySelector(
      ".t--application-description",
    ) as HTMLElement;

    fireEvent.click(field);
    const input = document.querySelector(
      ".t--application-description textarea",
    ) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith("app-1", { description: "" });

    // Closing the menu must not re-send the same value.
    fireEvent.keyDown(document.activeElement || document.body, {
      key: "Escape",
    });

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("allows retrying the same description after a failed save", () => {
    const update = jest.fn();
    const app = buildApplication({ description: "Old blurb" });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} update={update} />,
    );

    const trigger = getByTestId("t--application-card-context-menu");

    fireEvent.keyDown(trigger, { key: "Enter" });

    const editAndBlur = (value: string) => {
      const field = document.querySelector(
        ".t--application-description",
      ) as HTMLElement;

      fireEvent.click(field);
      const input = document.querySelector(
        ".t--application-description textarea",
      ) as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
    };

    editAndBlur("Retry me");
    expect(update).toHaveBeenCalledTimes(1);

    // The request goes out and fails; the store never learns the new value.
    act(() => {
      store.dispatch({
        type: ReduxActionTypes.UPDATE_APPLICATION,
        payload: { id: "app-1", description: "Retry me" },
      });
    });
    act(() => {
      store.dispatch({
        type: ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR,
        payload: {},
      });
    });

    editAndBlur("Retry me");
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("wraps the description to three lines in the card menu when not editing", () => {
    const app = buildApplication({
      description: "A long enough description to wrap",
    });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} update={jest.fn()} />,
    );

    fireEvent.keyDown(getByTestId("t--application-card-context-menu"), {
      key: "Enter",
    });

    const wrapper = getByTestId("t--application-description-editor");

    const readModeContent =
      "&&&& .bp3-editable-text:not(.bp3-editable-text-editing) .bp3-editable-text-content";

    expect(wrapper).toHaveStyleRule("-webkit-line-clamp", "3", {
      modifier: readModeContent,
    });
    expect(wrapper).toHaveStyleRule("white-space", "normal !important", {
      modifier: readModeContent,
    });
  });

  it("edits the description in a multi-line field and the name in a single-line one", () => {
    const app = buildApplication({ description: "Old blurb" });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} update={jest.fn()} />,
    );

    fireEvent.keyDown(getByTestId("t--application-card-context-menu"), {
      key: "Enter",
    });

    fireEvent.click(
      document.querySelector(".t--application-description") as HTMLElement,
    );
    expect(
      document.querySelector(".t--application-description textarea"),
    ).toBeTruthy();

    fireEvent.click(
      document.querySelector(".t--application-name") as HTMLElement,
    );
    expect(document.querySelector(".t--application-name input")).toBeTruthy();
  });

  it("collapses line breaks in the description on save", () => {
    const update = jest.fn();
    const app = buildApplication({ description: "Old blurb" });

    const { getByTestId } = render(
      <ApplicationCard {...baseProps} application={app} update={update} />,
    );

    fireEvent.keyDown(getByTestId("t--application-card-context-menu"), {
      key: "Enter",
    });
    fireEvent.click(
      document.querySelector(".t--application-description") as HTMLElement,
    );
    const field = document.querySelector(
      ".t--application-description textarea",
    ) as HTMLTextAreaElement;

    fireEvent.change(field, {
      target: { value: "First line\nsecond   line\n" },
    });
    fireEvent.blur(field);

    expect(update).toHaveBeenCalledWith("app-1", {
      description: "First line second line",
    });
  });

  it("hides the description editor from the card menu without edit permission", () => {
    // Export permission keeps the menu itself visible; manage permission is what
    // gates the editable name/description/colour/icon controls.
    const app = buildApplication({
      userPermissions: ["read:applications", "export:applications"],
      description: "Read only",
    });

    const { getByTestId } = render(
      <ApplicationCard
        {...baseProps}
        application={app}
        enableImportExport
        update={jest.fn()}
      />,
    );

    const trigger = getByTestId("t--application-card-context-menu");

    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(document.querySelector(".t--application-description")).toBeNull();
  });

  it("renders no description element when the description is whitespace", () => {
    const app = buildApplication({ description: "   " });

    const { queryByTestId } = render(
      <ApplicationCard {...baseProps} application={app} />,
    );

    expect(queryByTestId("t--app-card-description")).toBeNull();
  });
});
