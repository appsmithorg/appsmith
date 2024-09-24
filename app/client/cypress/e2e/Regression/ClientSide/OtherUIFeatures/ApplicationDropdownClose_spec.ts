import homePage from "../../../../locators/HomePage";
const omnibar = require("../../../../locators/Omnibar.json");

describe("application dropdown interaction test", () => {
  it("application dropdown closes when interacting with omni bar using hotkeys", () => {
    cy.get(homePage.applicationName).click();
    cy.get(homePage.applicationEditMenu).should("be.visible");
    cy.wait(1000);
    cy.get("body").type("{ctrl}{k}");
    cy.get(omnibar.categoryTitle).should("be.visible");
    cy.get(homePage.applicationEditMenu).should("not.exist");
    cy.get("body").type("{esc}");
    cy.get(omnibar.categoryTitle).should("not.exist");
    cy.get(homePage.applicationName).click();
    cy.get(homePage.applicationEditMenu).should("be.visible");
    cy.wait(1000);
    cy.get("body").type("{ctrl}{p}");
    cy.get(homePage.applicationEditMenu).should("not.exist");
  });
});
