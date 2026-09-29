import React from "react";
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

  it("renders no description element when the description is whitespace", () => {
    const app = buildApplication({ description: "   " });

    const { queryByTestId } = render(
      <ApplicationCard {...baseProps} application={app} />,
    );

    expect(queryByTestId("t--app-card-description")).toBeNull();
  });
});
