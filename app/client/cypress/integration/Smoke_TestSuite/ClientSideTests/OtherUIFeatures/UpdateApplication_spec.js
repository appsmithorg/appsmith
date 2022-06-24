import homePage from "../../../../locators/HomePage";
const commonlocators = require("../../../../locators/commonlocators.json");
import tinycolor from "tinycolor2";

describe("Update Application", () => {
  let appname;
  let iconname;
  let colorname;
  let veryLongAppName = `gnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionih1gnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionih1${Math.random()
    .toString(36)
    .slice(2, -1)}`;

  it("Open the application menu and update name and then check whether update is reflected in the application card", () => {
    cy.get(commonlocators.homeIcon).click({ force: true });
    appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).clear();
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.applicationName).type(`${appname} updated` + "{enter}");
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.applicationCardName).should("contain", appname);
  });

  it("Open the application menu and update icon and then check whether update is reflected in the application card", () => {
    cy.get(homePage.applicationIconSelector)
      .first()
      .click();
    cy.wait("@updateApplication")
      .then((xhr) => {
        iconname = xhr.response.body.data.icon;
      })
      .should("have.nested.property", "response.body.responseMeta.status", 200);
    cy.get(homePage.applicationCard)
      .first()
      .within(() => {
        cy.get("a")
          .invoke("attr", "name")
          .should("equal", iconname);
      });
  });

  it("Check for errors in updating application name", () => {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePage.searchInput).clear();
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon)
      .first()
      .click({ force: true });
    cy.get("#loading").should("not.exist");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.AppSetupForRename();
    cy.get(homePage.applicationName).type("  ");
    cy.get(homePage.toastMessage).should(
      "contain",
      "Application name can't be empty",
    );

    cy.AppSetupForRename();
    cy.get(homePage.applicationName).type("  " + "{enter}");
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.data.name",
      `${appname} updated`,
    );
  });

  it("Updates the name of first application to very long name and checks whether update is reflected in the application card with a popover", () => {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePage.searchInput).clear();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.applicationName).type(veryLongAppName + "{enter}");
    cy.get(homePage.appsContainer).click({ force: true });
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.searchInput).type(veryLongAppName);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .find(homePage.applicationCardName)
      .trigger("mouseover");
    cy.get(".bp3-popover-target.bp3-popover-open").should("have.length", 1);
  });
});
