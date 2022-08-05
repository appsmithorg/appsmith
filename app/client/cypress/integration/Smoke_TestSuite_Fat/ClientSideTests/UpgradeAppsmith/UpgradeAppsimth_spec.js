const publishPage = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

const testUrl = "http://localhost:5001/v1/parent/cmd";
describe("Upgrade appsmith version", () => {
  it("Upgrade Appsmith version and verify the Applications", () => {
    cy.GetCWD(testUrl);

    cy.log("Stop the container");
    cy.StopTheContainer(testUrl, "appsmith"); // stop the old container
    cy.wait(2000);

    cy.GetCWD(testUrl);

    cy.log("Get path");
    cy.GetPath(testUrl, "appsmith").then((path) => {
      cy.log(path);
      path = path.split("  ");
      path = path[1].split(" ");
      path = path[0].slice(0, -7);
      cy.log(path);

      cy.GetCWD(testUrl);

      cy.log("Start old stack container");
      cy.CreateAContainer(
        testUrl,
        path + "/oldstack/160",
        "release",
        "appsmith-160-updated",
      );
      cy.wait(45000);

      cy.log("Verify Logs");
      cy.GetAndVerifyLogs(testUrl, "appsmith"); // Get and verify the logs
    });

    //verify the Applications after upgrade
    cy.LoginFromAPI(testdata.UPGRADEUSERNAME, testdata.UPGRADEPASSWORD);
    cy.visit(testdata.APPURL);

    cy.get(".t--buttongroup-widget").should("exist");
    cy.get(".t--buttongroup-widget")
      .children()
      .should("have.length", 3);

    cy.get(publishPage.backToEditor).click({ force: true });

    cy.get(".t--buttongroup-widget").should("exist");
    cy.get(".t--buttongroup-widget")
      .children()
      .should("have.length", 3);
  });

  it("Upgrade Appsmith from CE to EE and verify the Applications", () => {
    cy.log("Stop the container");
    cy.StopTheContainer(testUrl, "appsmith-160-updated"); // stop the old container
    cy.wait(2000);

    cy.log("Get path");
    cy.GetPath(testUrl, "appsmith").then((path) => {
      path = path.split("  ");
      path = path[1].split(" ");
      path = path[0].slice(0, -7);
      cy.log(path);

      cy.log("Start old stack container");
      cy.CreateAContainer(
        testUrl,
        path + "/oldstack/ce",
        "ee",
        "appsmith-enterprise",
      );
      cy.wait(45000);

      cy.log("Verify Logs");
      cy.GetAndVerifyLogs(testUrl, "appsmith"); // Get and verify the logs
    });

    //verify the Applications after upgrade
    cy.LoginFromAPI(testdata.UPGRADEUSERNAME, testdata.UPGRADEPASSWORD);
    cy.visit(testdata.APPURL);

    cy.get(".t--buttongroup-widget").should("exist");
    cy.get(".t--buttongroup-widget")
      .children()
      .should("have.length", 3);

    cy.get(publishPage.backToEditor).click({ force: true });

    cy.get(".t--buttongroup-widget").should("exist");
    cy.get(".t--buttongroup-widget")
      .children()
      .should("have.length", 3);
  });
});
