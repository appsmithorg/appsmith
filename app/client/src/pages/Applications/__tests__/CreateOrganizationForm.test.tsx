import React from "react";
import userEvent from "@testing-library/user-event";
import { unmountComponentAtNode } from "react-dom";
import { render } from "test/testUtils";
import { act } from "react-dom/test-utils";
import CreateOrganisationMockResponse from "mockResponses/CreateOrganisationMockResponse.json";

import Applications from "../index";

let container: any = null;
describe("Applications", () => {
  beforeEach(async () => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("create a new organisation", async (done) => {
    const { findByText } = render(
      <Applications
        deleteApplication={() => {
          console.log("Delete application");
        }}
      />,
    );
    const createOrgLink = await findByText("Create Organization");
    // recommended to use act when dispatching events
    // that might result in state updates
    act(() => {
      userEvent.click(createOrgLink);
    });
    const orgName = CreateOrganisationMockResponse.data.name;

    await findByText(orgName);

    await done();
  });

  it("checks that create new application is visible", async (done) => {
    const { findAllByText } = render(
      <Applications
        deleteApplication={() => {
          console.log("Delete application");
        }}
      />,
    );

    const orgs = await findAllByText("Create New");
    expect(orgs.length).toEqual(2);
    await done();
  });

  it("checks that share button is clickable and opens a modal", async (done) => {
    const { findAllByText, findByText } = render(
      <Applications
        deleteApplication={() => {
          console.log("Delete application");
        }}
      />,
    );

    const shares = await findAllByText("Share");
    act(() => {
      userEvent.click(shares[0]);
    });

    await findByText("Invite Users to b1's apps");
    await done();
  });

  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });
});
