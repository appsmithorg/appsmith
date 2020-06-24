const ApiEditor = require("../../../locators/ApiEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("Test curl import flow", function() {
  it("Test curl import flow Run and Delete", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      "curl -X GET http://app.appsmith.com/scrap/api?slugifiedName=Freshdesk&ownerName=volodimir.kudriachenko",
    );
    cy.importCurl();
    cy.xpath(apiwidget.EditApiName).should("be.visible");
    cy.get("@curlImport").then(response => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then(text => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });
    //cy.WaitAutoSave();
    cy.RunAPI();
    cy.ResponseStatusCheck("200 OK");
    cy.get(ApiEditor.formActionButtons).should("be.visible");
    cy.get(ApiEditor.ApiDeleteBtn).click();
    cy.get(ApiEditor.ApiDeleteBtn).should("be.disabled");
    cy.wait("@deleteAction");
    cy.get("@deleteAction").then(response => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
    });
    cy.get(ApiEditor.ApiHomePage).should("be.visible");
    cy.get(ApiEditor.formActionButtons).should("not.be.visible");
  });
});
