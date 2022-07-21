const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pages = require("../../../../locators/Pages.json");
const globalSearchLocators = require("../../../../locators/GlobalSearch.json");
import ApiEditor from "../../../../locators/ApiEditor";

describe("Test curl import flow", function() {
  it("Test curl import flow Run and Delete", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type("curl -X GET https://mock-api.appsmith.com/users");
    cy.importCurl();
    cy.get("@curlImport").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });
    //cy.WaitAutoSave();
    cy.RunAPI();
    cy.ResponseStatusCheck("200 OK");
    cy.get(ApiEditor.formActionButtons).should("be.visible");
    cy.get(ApiEditor.ApiActionMenu)
      .first()
      .click();
    cy.get(ApiEditor.ApiDeleteBtn).click();
    cy.get(ApiEditor.ApiDeleteBtn)
      .contains("Are you sure?")
      .click();
    cy.wait("@deleteAction");
    cy.get("@deleteAction").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
    });
  });
  it("Bug:15175 Creating new cURL import query from entity explorer crashes the app", function() {
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.get(globalSearchLocators.createNew).click();
    cy.xpath("//span[text()='New cURL Import']").click();
    cy.get("textarea").type(
      'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST https://mock-api.appsmith.com/echo/post',
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.RunAPI();
    cy.ResponseStatusCheck("201 CREATED");
    cy.get("@curlImport").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });
  });
});
