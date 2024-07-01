import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe("Visual regression tests", { tags: ["@tag.Visual"] }, () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update.
  //  2. Run test in headless mode with any browser
  //      command: "npx cypress run --spec cypress/e2e/Regression/ClientSide/VisualTests/AppPageLayout_spec.js  --browser chrome"
  //  3. New screenshot will be generated in the snapshot folder.

  it("1. Layout validation for app page in edit mode", () => {
    _.homePage.NavigateToHome();
    //cy.wait(3000);
    _.homePage.CreateNewApplication();
    //cy.get(".createnew").should("be.visible").first().click();
    cy.wait(3000);
    // taking screenshot of app home page in edit mode
    cy.get("#root").matchImageSnapshot("apppage");

    //Layout validation for Quick page wizard
    PageList.AddNewPage(Cypress.env("MESSAGES").GENERATE_PAGE_ACTION_TITLE());
    cy.wait(2000);
    // taking screenshot of generate crud page
    cy.get("#root").matchImageSnapshot("quickPageWizard");

    //Layout Validation for App builder Page
    _.agHelper.GoBack();
    cy.wait(2000);
    // taking screenshot of app builder page
    cy.get("#root").matchImageSnapshot("emptyAppBuilder");

    //Layout Validation for Empty deployed app
    _.deployMode.DeployApp();
    cy.wait(3000);
    // taking screenshot of empty deployed app
    cy.get("#root").matchImageSnapshot("EmptyApp");

    //Layout Validation for profile page
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--edit-profile").click();
    cy.wait(2000);
    // taking screenshot of profile page
    cy.get("#root").matchImageSnapshot("Profile");

    //Layout validation for login page
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating all the fields on login page
    cy.xpath("//h1").should(
      "have.text",
      Cypress.env("MESSAGES").LOGIN_PAGE_TITLE(),
    );
    cy.get(".bp3-label").first().should("have.text", "Email ");
    cy.get(".bp3-label").last().should("have.text", "Password ");
    cy.xpath('//span[text()="Sign in"]').should("be.visible");
    cy.get(".bp3-label").first().click();
    cy.matchImageSnapshot("loginpage");
  });
});
