/* eslint-disable no-console */
const publishPage = require("../../locators/publishWidgetspage.json");
const testdata = require("../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../support/Objects/Registry";

//let agHelper = ObjectsRegistry.AggregateHelper;
const testUrl = "http://localhost:5001/v1/parent/cmd";
describe("Upgrade appsmith version", () => {
  it("Upgrade Appsmith version and verify the Applications", () => {
    const uuid = () => Cypress._.random(0, 10000);
    const name = uuid();
    cy.wait(2000);

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

      localStorage.setItem("ContainerName", `appsmith-160_${name}_updated`);

      cy.log("Start old stack container");
      cy.CreateAContainer(
        testUrl,
        path + "/oldstack/tempStacks/oldstacks",
        "appsmith/appsmith-ce:release",
        `appsmith-160_${name}_updated`,
      );
      cy.wait(60000);

      cy.GetAndVerifyLogs(testUrl, `appsmith-160_${name}_updated`); // Get and verify the logs
    });

    //verify the Applications after upgrade
    cy.visit(testdata.APPURL);
    cy.get(".t--widget-tablewidgetv2").should("exist");
    cy.wait(1000);
    cy.get(".bp3-icon-refresh").click();
    cy.get(".tbody>div:nth-child(2)", { timeout: 2000 }).click({ force: true });

    cy.get(".tbody>div:nth-child(2)", { timeout: 2000 }).should(
      "have.text",
      "1Development3expertise",
    );

    cy.get(".t--jsonformfield-label input", { timeout: 2000 }).should(
      "have.value",
      "Development3",
    );
    cy.get(".t--jsonformfield-type input", { timeout: 2000 }).should(
      "have.value",
      "expertise",
    );
    cy.get(".t--jsonformfield-rowIndex input", { timeout: 2000 }).should(
      "have.value",
      "1",
    );

    cy.get(".t--jsonform-footer .bp3-button>span", { timeout: 2000 })
      .eq(1)
      .click({ force: true });

    cy.wait(2000);

    cy.get(".t--widget-iconbuttonwidget", { timeout: 2000 }).click({
      force: true,
    });
    cy.wait(2000);

    cy.get(".tbody>div:nth-child(2)", { timeout: 2000 }).should(
      "have.text",
      "1Development2expertise",
    );

    // cy.get(".tbody>div:nth-child(2)", { timeout: 2000 }).click();

    // cy.get(".t--jsonformfield-label input", { timeout: 2000 }).type(
    //   "Development3",
    // );
    // cy.get(".t--jsonform-footer .bp3-button>span", { timeout: 2000 })
    //   .eq(1)
    //   .click({ force: true });

    cy.log("Stop the container");
    cy.StopTheContainer(testUrl, localStorage.getItem("ContainerName")); // stop the old container
    cy.wait(2000);
  });

  // it.skip("Upgrade Appsmith from CE to EE and verify the Applications", () => {
  //   cy.log("Stop the appsmith container");
  //   cy.StopTheContainer(testUrl, "appsmith"); // stop the old container
  //   cy.wait(2000);

  //   const uuid = () => Cypress._.random(0, 10000);
  //   const name = uuid();
  //   cy.wait(2000);

  //   cy.log("Get path");
  //   cy.GetPath(testUrl, "appsmith").then((path) => {
  //     path = path.split("  ");
  //     path = path[1].split(" ");
  //     path = path[0].slice(0, -7);
  //     cy.log(path);

  //     localStorage.setItem(
  //       "ContainerName",
  //       `appsmith-160-ce-${name}-enterprise`,
  //     );

  //     cy.log("Start old stack container");
  //     cy.CreateEEContainer(
  //       testUrl,
  //       path + "/oldstack",
  //       "fatcontainer",
  //       `appsmith-160-ce-${name}-enterprise`,
  //     );
  //     cy.wait(45000);

  //     cy.log("Verify Logs");
  //     cy.GetAndVerifyLogs(testUrl, `appsmith-160-ce-${name}-enterprise`); // Get and verify the logs
  //   });

  //   //verify the Applications after upgrade
  //   cy.LoginFromAPI(testdata.UPGRADEUSERNAME, testdata.UPGRADEPASSWORD);
  //   cy.visit(testdata.APPURL);

  //   cy.get(".t--buttongroup-widget").should("exist");
  //   cy.get(".t--buttongroup-widget")
  //     .children()
  //     .should("have.length", 3);

  //   cy.get(publishPage.backToEditor).click({ force: true });

  //   cy.get(".t--buttongroup-widget").should("exist");
  //   cy.get(".t--buttongroup-widget")
  //     .children()
  //     .should("have.length", 3);
  // });
});
