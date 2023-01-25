const publishPage = require("../../locators/publishWidgetspage.json");
const testdata = require("../../fixtures/testdata.json");

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

      cy.execute(testUrl, "ls " + path + "/oldstack").then((res) => {
        cy.log("Files Inside oldstack", res.stdout);
      });

      cy.execute(testUrl, "ls " + path + "/oldstack/160").then((res1) => {
        cy.log("Files Inside oldstack/160", res1.stdout);
      });

      cy.execute(testUrl, "ls " + path + "/oldstack/ce").then((res) => {
        cy.log("Files Inside oldstack/ce", res.stdout);
      });

      localStorage.setItem("ContainerName", `appsmith-160_${name}_updated`);

      cy.log("Start old stack container");
      cy.CreateAContainer(
        testUrl,
        path + "/oldstack/160",
        "appsmith/appsmith-ce:release",
        `appsmith-160_${name}_updated`,
      );
      cy.wait(30000);

      let done = true;
      let count = 1;
      while (done) {
        cy.request({
          method: "GET",
          url: "http://localhost/api/v1/users/me",
        }).then((res) => {
          if (res.status != 200 && count != 12) {
            cy.wait(5000);
            count++;
          } else {
            done = false;
          }
        });
      }

      cy.log("Verify Logs");
      cy.GetAndVerifyLogs(testUrl, `appsmith-160_${name}_updated`); // Get and verify the logs
    });

    //verify the Applications after upgrade
    cy.visit("/");
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
