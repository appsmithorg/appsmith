/* eslint-disable no-console */
const testdata = require("../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../support/Objects/Registry";
import { CURRENT_REPO, REPO } from "../../../fixtures/REPO";

let agHelper = ObjectsRegistry.AggregateHelper;
const tedUrl = "http://localhost:5001/v1/parent/cmd";

describe("Upgrade appsmith version", () => {
  it("Upgrade Appsmith version and verify the Applications", () => {
    const uuid = () => Cypress._.random(0, 10000);
    const name = uuid();
    agHelper.Sleep(2000);

    cy.GetPath(tedUrl, "appsmith").then((path) => {
      path = path.split("  ");
      path = path[1].split(" ");
      path = path[0].slice(0, -7);

      localStorage.setItem("ContainerName", `appsmith-${name}`);

      //Start a new Container with old stack
      cy.StartNewContainer(
        tedUrl,
        path + "/oldstack",
        "cicontainer",
        `appsmith-${name}`,
      );
      //Wait for the container to be up
      agHelper.Sleep(60000);

      // Get and verify the logs
      cy.GetAndVerifyLogs(tedUrl, `appsmith-${name}`);
    });

    //verify the Applications after upgrade only on CE and skip for BE
    if (CURRENT_REPO === REPO.CE) {
      cy.forceVisit(testdata.APPURL);
      agHelper.GetNClick(".t--widget-iconbuttonwidget button", 0, true);
      agHelper.Sleep(1000);
      agHelper.GetNAssertElementText(
        ".tbody>div",
        "1Developmentexpertise",
        "have.text",
        1,
      );

      agHelper.GetNClick(".tbody>div", 1, true, 1000);
      agHelper.GetNAssertElementText(
        ".t--jsonformfield-label input",
        "Development",
        "have.value",
      );
      agHelper.GetNAssertElementText(
        ".t--jsonformfield-type input",
        "expertise",
        "have.value",
      );
      agHelper.GetNAssertElementText(
        ".t--jsonformfield-rowIndex input",
        "1",
        "have.value",
      );

      cy.get(".t--jsonformfield-label input").clear().type("DevelopmentUpdate");
      agHelper.GetNClick(".t--jsonform-footer button", 1, true);
      agHelper.Sleep(2000);
      agHelper.GetNClick(".t--widget-iconbuttonwidget button", 0, true, 1000);
      agHelper.GetNAssertElementText(
        ".tbody>div",
        "1DevelopmentUpdateexpertise",
        "have.text",
        1,
      );

      //Resetting the data
      agHelper.GetNClick(".tbody>div", 1, true, 1000);
      cy.get(".t--jsonformfield-label input").clear().type("Development");
      agHelper.GetNClick(".t--jsonform-footer button", 1, true);
      agHelper.Sleep(2000);
      agHelper.GetNClick(".t--widget-iconbuttonwidget button", 0, true, 1000);
      agHelper.GetNAssertElementText(
        ".tbody>div",
        "1Developmentexpertise",
        "have.text",
        1,
      );
    }
    // stop the container
    cy.StopContainer(tedUrl, localStorage.getItem("ContainerName"));
    agHelper.Sleep(2000);
  });
});
