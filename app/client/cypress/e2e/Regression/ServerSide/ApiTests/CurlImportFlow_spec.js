const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const globalSearchLocators = require("../../../../locators/GlobalSearch.json");
import ApiEditor from "../../../../locators/ApiEditor";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test curl import flow", function () {
  it("1. Test curl import flow Run and Delete", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      localStorage.setItem("ApiPaneV2", "ApiPaneV2");
      cy.NavigateToApiEditor();
      _.dataSources.NavigateToDSCreateNew();
      cy.get(ApiEditor.curlImage).click({ force: true });
      cy.get("textarea").type(
        "curl -X GET " + datasourceFormData["mockApiUrl"],
      );
      cy.importCurl();
      cy.get("@curlImport").then((response) => {
        expect(response.response.body.responseMeta.success).to.eq(true);
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
      _.agHelper.ActionContextMenuWithInPane("Delete");
      cy.get("@deleteAction").then((response) => {
        expect(response.response.body.responseMeta.success).to.eq(true);
      });
    });
  });

  it("2. Bug:15175 Creating new cURL import query from entity explorer crashes the app", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      cy.CheckAndUnfoldEntityItem("Pages");
      cy.get(`.t--entity-name:contains("Page1")`)
        .should("be.visible")
        .click({ force: true });
      cy.get(globalSearchLocators.createNew).click();
      cy.xpath("//span[text()='New cURL import']").click();
      cy.get("textarea").type(
        'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
          datasourceFormData["echoApiUrl"],
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
      cy.importCurl();
      cy.RunAPI();
      cy.ResponseStatusCheck("200 OK");
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

  it("3. Bug:19214 Test curl import flow for request without any headers", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      cy.NavigateToApiEditor();
      _.dataSources.NavigateToDSCreateNew();
      cy.get(ApiEditor.curlImage).click({ force: true });
      cy.get("textarea").type(
        "curl -X POST " + datasourceFormData["echoApiUrl"],
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
      cy.importCurl();
      _.apiPage.AssertEmptyHeaderKeyValuePairsPresent(0);
      _.apiPage.AssertEmptyHeaderKeyValuePairsPresent(1);
    });
  });
});
