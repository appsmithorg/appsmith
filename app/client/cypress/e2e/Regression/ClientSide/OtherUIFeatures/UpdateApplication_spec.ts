import homePage from "../../../../locators/HomePage";
import { agHelper } from "../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Update Application", { tags: ["@tag.Workspace"] }, () => {
  let appname, workspaceName;
  let iconname;
  let veryLongAppName = `gnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionih1gnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionih1${Math.random()
    .toString(36)
    .slice(2, -1)}`;

  it("1. Open the application menu and update name and then check whether update is reflected in the application card", () => {
    cy.get(commonlocators.homeIcon).click({ force: true });
    workspaceName = localStorage.getItem("workspaceName");
    appname = localStorage.getItem("appName");

    cy.get(homePage.searchInput).clear();
    cy.get(homePage.searchInput).click().type(workspaceName);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.appMoreIcon).first().click({ force: true });
    cy.get(homePage.applicationName)
      .click()
      .type(`${appname} updated` + "{enter}");
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.applicationCardName).should("contain", appname);
  });

  it("2. Open the application menu and update icon and then check whether update is reflected in the application card", () => {
    cy.get(homePage.applicationIconSelector).first().click();
    cy.wait("@updateApplication")
      .then((xhr) => {
        iconname = xhr.response.body.data.icon;
      })
      .should("have.nested.property", "response.body.responseMeta.status", 200);
    cy.get(homePage.applicationCard)
      .first()
      .within(() => {
        cy.get("a").invoke("attr", "name").should("equal", iconname);
      });
  });

  it("3. Check for errors in updating application name", () => {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePage.searchInput).clear();
    cy.get(homePage.searchInput).click().type(workspaceName);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard).first().trigger("mouseover");
    cy.get(homePage.appEditIcon).first().click({ force: true });
    cy.get("#loading").should("not.exist");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.AppSetupForRename();
    cy.get(homePage.applicationName).click().type("  ");
    cy.get(homePage.toastMessage).should(
      "contain",
      "Application name can't be empty",
    );

    cy.AppSetupForRename();
    cy.get(homePage.applicationName)
      .click()
      .type("  " + "{enter}");
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.data.name",
      `${appname} updated`,
    );
  });

  it("4. Updates the name of first application to very long name and checks whether update is reflected in the application card with no popover", () => {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePage.searchInput).clear();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.appMoreIcon).first().click({ force: true });
    cy.get(homePage.applicationName)
      .click()
      .type(veryLongAppName + "{enter}");
    agHelper.GetNClick(homePage.workspaceCompleteSection, 0, true);
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.searchInput).click().type(veryLongAppName);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .find(homePage.applicationCardName)
      .trigger("mouseover", { force: true });
    cy.get(".bp3-popover-target.bp3-popover-open").should("not.exist");
  });
});
