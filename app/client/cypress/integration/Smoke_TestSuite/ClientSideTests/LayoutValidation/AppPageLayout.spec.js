const homePage = require("../../../../locators/HomePage.json");

describe("Visual regression tests", () => {
  // for any changes in UI, update the screenshot in snapshot folder
  it("Layout validation for first page of app creation", () => {
    cy.visit("/applications");
    cy.wait(3000);
    cy.get(".t--applications-container .createnew").should("be.visible");
    cy.get(".t--applications-container .createnew").click();
    cy.wait(5000);
    cy.get("#root").matchImageSnapshot("apppage");
  });
  it("Layout validation for Quick page wizard", () => {
    cy.get(".t--GenerateCRUDPage").click();
    cy.wait(2000);
    cy.get("#root").matchImageSnapshot("quickPageWizard");
  });
  it("Layout Validation for App builder Page", () => {
    cy.get(".bp3-icon-chevron-left").click();
    cy.get(".t--BuildFromScratch").click();
    cy.wait(2000);
    cy.get("#root").matchImageSnapshot("emptyAppBuilder");
  });
  it("Layout Validation for Empty deployed app", () => {
    cy.PublishtheApp();
    cy.wait(3000);
    cy.get("#root").matchImageSnapshot("EmptyApp");
  });
  it("Layout Validation for profile page", () => {
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--edit-profile").click();
    cy.wait(2000);
    cy.get("#root").matchImageSnapshot("Profile");
    cy.get("[data-cy=t--display-name]").should("have.value", "test");
    cy.get(".bp3-icon-chevron-left").click();
  });

  it("Layout validation for login page", () => {
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    cy.get(homePage.headerAppSmithLogo).should("be.visible");
    cy.xpath("//h1").should("have.text", "Sign in to your account");
    cy.get(".bp3-label")
      .first()
      .should("have.text", "Email ");
    cy.get(".bp3-label")
      .last()
      .should("have.text", "Password ");
    cy.xpath('//span[text()="sign in"]').should("be.visible");
    cy.get(".bp3-label")
      .first()
      .click();
    cy.xpath("//a")
      .eq(3)
      .should("have.text", "Privacy Policy");
    cy.xpath("//a")
      .eq(4)
      .should("have.text", "Terms and conditions");
    cy.matchImageSnapshot("loginpage");
  });
  // it("Layout validation for application page", () => {});
});
