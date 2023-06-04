const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;
let api = ObjectsRegistry.ApiPage;

describe("API Panel Test Functionality ", function () {
  it("1. Test API copy/Move/delete feature", function () {
    cy.Createpage("SecondPage");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");
    cy.enterDatasourceAndPath(testdata.baseUrl, "{{ '/random' }}");
    cy.assertPageSave();
    cy.get("body").click(0, 0);
    ee.ExpandCollapseEntity("Queries/JS");
    ee.ActionContextMenuByEntityName("FirstAPI", "Copy to page", "SecondPage");
    // assert GET API is present.
    api.AssertAPIVerb("GET");
    cy.get("body").click(0, 0);
    ee.ActionContextMenuByEntityName("FirstAPICopy", "Move to page", "Page1");
    cy.wait(2000);
    ee.ExpandCollapseEntity("Queries/JS");
    cy.get(".t--entity-name").contains("FirstAPICopy").click({ force: true });
    cy.get(apiwidget.resourceUrl).should("contain.text", "{{ '/random' }}");
  });
});
