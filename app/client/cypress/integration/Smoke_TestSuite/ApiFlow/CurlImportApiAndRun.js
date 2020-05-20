const ApiEditor = require("../../../locators/ApiEditor.json");

describe("Test curl import api and run flow", function() {
  it("Test curl import api and run flow", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      "curl -X GET http://app.appsmith.com/scrap/api?slugifiedName=Freshdesk&ownerName=volodimir.kudriachenko",
    );
    cy.importCurl();
    cy.get(ApiEditor.ApiNameField).should("be.visible");
    cy.get("@curlImport").then(httpResponse => {
      cy.expect(httpResponse.response.body.responseMeta.success).to.eq(true);
      cy.get(ApiEditor.ApiNameField).should(
        "have.value",
        httpResponse.response.body.data.name,
      );
    });
    /*
    cy.get(ApiEditor.ApiRunBtn).click();
    cy.get(ApiEditor.ApiRunBtn).should("be.disabled");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    */
    cy.SaveAPI();
    cy.get(ApiEditor.formActionButtons).should("be.visible");
    cy.get("@postExecute").then(httpResponse => {
      cy.expect(httpResponse.response.body.responseMeta.success).to.eq(true);
    });
  });
});
