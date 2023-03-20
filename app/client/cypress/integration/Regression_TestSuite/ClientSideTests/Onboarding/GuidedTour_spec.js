const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const onboardingLocators = require("../../../../locators/FirstTimeUserOnboarding.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorerLocators = require("../../../../locators/explorerlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Guided Tour", function () {
  it("1. Guided tour should work when started from the editor", function () {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmith.com`, uid);
    });
    cy.get(onboardingLocators.introModalWelcomeTourBtn).should("be.visible");
    cy.get(onboardingLocators.introModalWelcomeTourBtn).click();
    cy.get(onboardingLocators.welcomeTourBtn).should("be.visible");
  });

  it("2. Guided Tour", function () {
    // Start guided tour
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(guidedTourLocators.welcomeTour).click();
    cy.get(guidedTourLocators.startBuilding).click();
    cy.get(explorerLocators.entityExplorer).should("not.be.visible");
    // Refresh the page to validate if the tour resumes
    cy.reload();
    cy.get(".query-page").then(($ele) => {
      if ($ele.find(guidedTourLocators.banner).length) {
        cy.get(guidedTourLocators.banner).should("be.visible");
      }
    });
    _.dataSources.SetQueryTimeout();
    // Step 1: Run query
    _.dataSources.RunQuery();
    cy.get(guidedTourLocators.successButton).click();
    // Step 2: Select table widget
    cy.SearchEntityandOpen("CustomersTable");
    // Step 3: Add binding to the tableData property
    _.propPane.UpdatePropertyFieldValue("Table Data", "{{getCustomers.data}}");
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
    // Renaming widgets // Commending below wait due to flakiness
    //cy.wait("@updateWidgetName");
    // Step 4: Add binding to the defaultText property of NameInput
    cy.wait(3000);
    cy.get("body").then(($body) => {
      if ($body.find(guidedTourLocators.hintButton).length > 0) {
        cy.get(guidedTourLocators.hintButton).click();
        cy.wait(1000); //for NameInput to open
        _.propPane.UpdatePropertyFieldValue(
          "Default Value",
          "{{CustomersTable.selectedRow.name}}",
        );
      } else {
        cy.wait(1000);
        cy.get(guidedTourLocators.inputfields)
          .first()
          .clear({ force: true })
          .click({ force: true }); //Name input
        _.propPane.UpdatePropertyFieldValue(
          "Default Value",
          "{{CustomersTable.selectedRow.name}}",
        );
      }
    });
    cy.get(guidedTourLocators.successButton).click();
    // Step 5: Add binding to the rest of the widgets in the container
    cy.get(guidedTourLocators.inputfields)
      .eq(1)
      .clear({ force: true })
      .click({ force: true }); //Email input
    _.propPane.UpdatePropertyFieldValue(
      "Default Value",
      "{{CustomersTable.selectedRow.email}}",
    );
    cy.get(".t--entity-name").contains("CountryInput").click({ force: true });
    cy.wait(1000);
    cy.get(guidedTourLocators.inputfields)
      .eq(2)
      .clear({ force: true })
      .click({ force: true }); //Country input
    _.propPane.UpdatePropertyFieldValue(
      "Default Value",
      "{{CustomersTable.selectedRow.country}}",
    );
    cy.get(".t--entity-name").contains("DisplayImage").click({ force: true });
    cy.get(guidedTourLocators.successButton).click();
    // Step 6: Drag and drop a widget
    cy.dragAndDropToCanvas("buttonwidget", {
      x: 800,
      y: 750,
    });
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
    // Step 7: Execute a query onClick
    cy.executeDbQuery("updateCustomerInfo");
    // Step 8: Execute getCustomers onSuccess
    cy.get(
      `.t--property-control-onclick [data-guided-tour-iid='onSuccess'] ${commonlocators.dropdownSelectButton}`,
    )
      .eq(0)
      .click({ force: true })
      .wait(500)
      .get("ul.bp3-menu")
      .children()
      .contains("Execute a query")
      .click()
      .wait(500)
      .get("ul.bp3-menu")
      .children()
      .contains("getCustomers")
      .click({ force: true });
    cy.get(guidedTourLocators.successButton).click();
    // Step 9: Deploy
    cy.PublishtheApp();
    cy.get(guidedTourLocators.rating).should("be.visible");
    cy.get(guidedTourLocators.rating).eq(4).click();
    cy.get(guidedTourLocators.startBuilding).should("be.visible");
    cy.get(guidedTourLocators.startBuilding).click();
  });
});
