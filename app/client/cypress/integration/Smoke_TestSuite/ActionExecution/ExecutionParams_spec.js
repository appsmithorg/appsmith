const dsl = require("../../../fixtures/executionParamsDsl.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("API Panel Test Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Will pass static values in params", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("StaticParams");
    cy.enterDatasourceAndPath(
      "https://jsonplaceholder.typicode.com/",
      "{{this.params.endpoint}}",
    );
    cy.WaitAutoSave();

    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{StaticParams.data");

    cy.SearchEntityandOpen("RunButton");
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click();

    cy.testJsontext(
      "onclick",
      "{{StaticParams.run(undefined, undefined, { endpoint: 'users",
    );
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).click();
    cy.readTabledataPublish("1", "1").then(cellData => {
      expect(cellData).to.be.equal("Ervin Howell");
    });
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Will pass dynamic values in params", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("DynamicParams");
    cy.enterDatasourceAndPath(
      "https://jsonplaceholder.typicode.com/",
      "{{this.params.endpoint || 'posts'}}",
    );

    cy.SearchEntityandOpen("RunButton");
    cy.testJsontext(
      "onclick",
      "{{DynamicParams.run(undefined, undefined, { endpoint: EndpointInput.text",
    );

    cy.PublishtheApp();

    cy.get(publishPage.buttonWidget).click();

    cy.readTabledataPublish("0", "2").then(cellData => {
      expect(cellData).to.be.equal("delectus aut autem");
    });
  });
});
