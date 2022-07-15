import HomePage from "../../../../locators/HomePage";
const testdata = require("../../../../fixtures/testdata.json");

const testUrl = "http://localhost:5001/v1/parent/cmd";
describe("MongoDB Upgrade functionality", () => {
  it("Upgrade Mongo DB and verify the Applications", () => {
    cy.StopTheContainer(testUrl, "appsmith-api-160"); // stop the old container
    cy.wait(2000);

    cy.CreateLatestContainer(testUrl, "appsmith-api-latest"); //Create Latest Container
    cy.wait(2000);

    cy.GetAndVerifyLogs(testUrl, "appsmith-api-latest"); // Get and verify the logs

    // Wait until server gets started
    cy.wait(50000);

    // verify the Applications after upgrade
    cy.LogintoApp(testdata.UPGRADEUSERNAME, testdata.UPGRADEPASSWORD);
    cy.get(HomePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(HomePage.appEditIcon)
      .first()
      .click({ force: true });

    cy.get(".t--buttongroup-widget").should("exist");
    cy.get(".t--buttongroup-widget")
      .children()
      .should("have.length", 3);
  });
});
