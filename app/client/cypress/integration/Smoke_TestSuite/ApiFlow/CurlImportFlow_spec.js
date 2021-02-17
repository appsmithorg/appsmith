const ApiEditor = require("../../../locators/ApiEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("Test curl import flow", function() {
  it("Test curl import flow Run and Delete", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").should(
      "have.attr",
      "placeholder",
      "curl -X GET https://mock-api.appsmith.com/users",
    );
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
    cy.get(ApiEditor.ApiActionMenu).click();
    cy.get(ApiEditor.ApiDeleteBtn).click();
    cy.wait("@deleteAction");
    cy.get("@deleteAction").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
    });
    cy.get(ApiEditor.ApiHomePage).should("be.visible");
    cy.get(ApiEditor.formActionButtons).should("not.exist");
  });
});
