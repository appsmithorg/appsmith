import homePageLocatores from "../../../locators/HomePage";
import { homePage } from "../../../support/Objects/ObjectsCore";

describe("Export application shows valid toast message", function () {
  const updatedAppName = "sample";
  const applicationNameClass = ".bp3-editable-text-content";
  const renameAppInputClass = ".bp3-editable-text-input";

  it("Toast message shows updated app name when app is exported after renaming the application", function () {
    homePage.NavigateToHome();

    cy.get(homePageLocatores.appMoreIcon).first().click({ force: true });

    //Rename application name
    cy.get(applicationNameClass).click({ force: true });
    cy.get(renameAppInputClass).clear().type(`${updatedAppName}`);

    // export application
    cy.get(homePageLocatores.exportAppFromMenu).click({ force: true });

    // checking updated name in toast message
    cy.get(homePageLocatores.toastMessage).should("contain", updatedAppName);
  });
});