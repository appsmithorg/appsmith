const dsl = require("../../../fixtures/executionParamsDsl.json");
const publishPage = require("../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../locators/commonlocators.json");

describe("API Panel Test Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Will pass execution params", function() {
    // Create the Api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("MultiApi");
    cy.enterDatasourceAndPath(
      "https://jsonplaceholder.typicode.com/",
      "{{this.params.endpoint || 'posts'}}",
    );
    cy.WaitAutoSave();
    // Run it
    cy.RunAPI();

    // Bind the table
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{MultiApi.data");
    // Assert 'posts' data (default)
    cy.readTabledataPublish("0", "2").then(cellData => {
      expect(cellData).to.be.equal(
        "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      );
    });

    // Choose static button
    cy.SearchEntityandOpen("StaticButton");
    // toggle js of onClick
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    // Bind with MultiApi with static value
    cy.testJsontext(
      "onclick",
      "{{MultiApi.run(undefined, undefined, { endpoint: 'users",
    );
    cy.get(commonlocators.editPropCrossButton).click();

    // Choose dynamic button
    cy.SearchEntityandOpen("DynamicButton");
    // toggle js of onClick
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    // Bind with MultiApi with dynamicValue value
    cy.testJsontext(
      "onclick",
      "{{MultiApi.run(undefined, undefined, { endpoint: EndpointInput.text",
    );

    // Publish the app
    cy.PublishtheApp();
    cy.wait("@postExecute");

    // Assert on load data in table
    cy.readTabledataPublish("0", "2").then(cellData => {
      expect(cellData).to.be.equal(
        "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      );
    });

    // Click Static button
    cy.get(publishPage.buttonWidget)
      .first()
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    // Assert statically bound "users" data
    cy.readTabledataPublish("1", "1").then(cellData => {
      expect(cellData).to.be.equal("Ervin Howell");
    });

    // Click dynamic button
    cy.get(publishPage.buttonWidget)
      .eq(1)
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    // Assert dynamically bound "todos" data
    cy.readTabledataPublish("0", "2").then(cellData => {
      expect(cellData).to.be.equal("delectus aut autem");
    });
  });
});
