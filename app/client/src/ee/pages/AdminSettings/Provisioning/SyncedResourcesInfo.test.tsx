import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import SyncedResourcesInfo from "./SyncedResourcesInfo";
import { StaticRouter } from "react-router";

const mockProvisioningDetails = {
  provisionedUsers: 10,
  provisionedGroups: 5,
  provisionStatus: "active",
  configuredStatus: true,
  apiKey: "apiKey",
  isLoading: {
    apiKey: false,
    provisionStatus: false,
    disconnectProvisioning: false,
  },
};

function renderComponent() {
  return render(
    <StaticRouter>
      <SyncedResourcesInfo provisioningDetails={mockProvisioningDetails} />
    </StaticRouter>,
  );
}

describe("SyncedResourcesInfo", () => {
  it("should render SyncedResourcesInfo correctly with the correct user and group counts", () => {
    const { getByTestId, getByText } = renderComponent();

    // Verify that the component renders without errors
    expect(getByTestId("synced-resources-info")).toBeInTheDocument();

    // Verify the rendered text content with the mocked provisioningDetails
    expect(
      getByText(`${mockProvisioningDetails.provisionedUsers} users`),
    ).toBeInTheDocument();
    expect(
      getByText(`${mockProvisioningDetails.provisionedGroups} groups`),
    ).toBeInTheDocument();
    expect(getByText("are linked to your IDP")).toBeInTheDocument();

    // Verify the rendered links
    const links = document.querySelectorAll(".ads-v2-link");
    expect(links).toHaveLength(2);

    // Verify the link properties
    expect(links[0]).toHaveAttribute(
      "href",
      "/settings/users?provisioned=true",
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/settings/groups?provisioned=true",
    );
  });
});
