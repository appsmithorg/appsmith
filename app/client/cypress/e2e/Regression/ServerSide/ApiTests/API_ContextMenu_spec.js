const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import {
  apiPage,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe("API Panel Test Functionality ", function () {
  it("1. Test API copy/Move/delete feature", function () {
    cy.Createpage("SecondPage");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");
    cy.enterDatasourceAndPath(testdata.baseUrl, "{{ '/random' }}");
    cy.assertPageSave();
    cy.get("body").click(0, 0);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "FirstAPI",
      action: "Copy to page",
      subAction: "SecondPage",
      toastToValidate: "action copied to page",
    });
    // assert GET API is present.
    apiPage.AssertAPIVerb("GET");
    cy.get("body").click(0, 0);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "FirstAPICopy",
      action: "Move to page",
      subAction: "Page1",
      toastToValidate: "action moved to page",
    });
    cy.wait(2000);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    cy.get(".t--entity-name").contains("FirstAPICopy").click({ force: true });
    cy.get(apiwidget.resourceUrl).should("contain.text", "{{ '/random' }}");
  });
});
