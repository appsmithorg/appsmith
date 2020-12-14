import localforage from "localforage";
const onboarding = require("../../../locators/Onboarding.json");
const explorer = require("../../../locators/explorerlocators.json");
const homePage = require("../../../locators/HomePage.json");

describe("Onboarding", function() {
  before(() => {
    cy.then(() => {
      const store = localforage.createInstance({
        name: "Appsmith",
      });
      return store.setItem("OnboardingState", true);
    });
  });

  it("Onboarding flow", function() {
    cy.contains(".t--create-database", "Explore Appsmith").click();

    cy.get(onboarding.tooltipAction).click();

    // Add widget
    cy.get(".t--add-widget").click();
    cy.dragAndDropToCanvas("tablewidget");

    cy.get(onboarding.tooltipSnippet).click({ force: true });
    cy.testJsontext("tabledata", "{{ExampleQuery.data}}");
    cy.closePropertyPane();
    cy.get(explorer.closeWidgets).click();

    cy.openPropertyPane("tablewidget");
    cy.get(onboarding.tooltipAction).click({ force: true });

    cy.get(homePage.publishButton).click();

    cy.get(homePage.closeBtn).click();
    cy.get(".t--continue-on-my-own").click();
  });
});
