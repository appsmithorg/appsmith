import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResourceLinks from "./ResourceLinks";
import { StaticRouter } from "react-router";

const mockData = {
  provisionedUsers: 10,
  provisionedGroups: 5,
};

function renderComponent() {
  return render(
    <StaticRouter>
      <ResourceLinks
        origin="test"
        provisionedGroups={mockData.provisionedGroups}
        provisionedUsers={mockData.provisionedUsers}
      />
    </StaticRouter>,
  );
}

describe("ResourceLinks", () => {
  it("should render links correctly with the correct user and group counts", () => {
    const { getAllByTestId, getByText } = renderComponent();

    // Verify the rendered text content with the mocked provisioningDetails
    expect(getByText(`${mockData.provisionedUsers} users`)).toBeInTheDocument();
    expect(
      getByText(`${mockData.provisionedGroups} groups`),
    ).toBeInTheDocument();

    // Verify the rendered links
    const links = getAllByTestId("linked-resources-link");
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
