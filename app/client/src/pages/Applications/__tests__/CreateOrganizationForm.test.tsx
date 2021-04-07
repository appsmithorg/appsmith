import React from "react";
import userEvent from "@testing-library/user-event";
import { unmountComponentAtNode } from "react-dom";
import { render, fireEvent } from "test/testUtils";
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
    const { findByDataCy, findByText } = render(
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
    const form = await findByDataCy("create-organisation-form");
    const orgNameField = await findByDataCy("create-organisation-form__name");

    act(() => {
      userEvent.type(orgNameField, orgName);
      fireEvent.submit(form);
    });

    await findByText(orgName);

    await done();
  });
  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });
});
