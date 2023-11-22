import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const onboardingLocators = require("../../../../locators/FirstTimeUserOnboarding.json");
const explorerLocators = require("../../../../locators/explorerlocators.json");
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  homePage,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import { ObjectsRegistry as _ } from "../../../../support/Objects/Registry";

describe("excludeForAirgap", "Guided Tour", function () {
  it("1. Guided tour should work when started from the editor", function () {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmith.com`, uid);
    });
    cy.get(onboardingLocators.editorWelcomeTourBtn).should("be.visible");
    cy.get(onboardingLocators.editorWelcomeTourBtn).click();
    cy.get(onboardingLocators.welcomeTourBtn).should("be.visible");
  });

  it("2. Guided Tour", function () {
    // Start guided tour
    homePage.NavigateToHome();
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
    dataSources.SetQueryTimeout();
    // Step 1: Run query
    dataSources.RunQuery();
    cy.get(guidedTourLocators.successButton).click();
    // Step 2: Select table widget
    cy.xpath(_.EntityExplorer._entityNameInExplorer("CustomersTable"))
      .first()
      .click({ force: true });

    // Step 3: Add binding to the tableData property
    propPane.UpdatePropertyFieldValue(
      "Table data",
      "{{getCustomers.data}}",
      true,
      false,
    );
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
        propPane.UpdatePropertyFieldValue(
          "Default value",
          "{{CustomersTable.selectedRow.name}}",
          true,
          false,
        );
      } else {
        cy.wait(1000);
        cy.get(guidedTourLocators.inputfields)
          .first()
          .clear({ force: true })
          .click({ force: true }); //Name input
        propPane.UpdatePropertyFieldValue(
          "Default value",
          "{{CustomersTable.selectedRow.name}}",
          true,
          false,
        );
      }
    });
    cy.get(guidedTourLocators.successButton).click();
    // Step 5: Add binding to the rest of the widgets in the container
    cy.get(guidedTourLocators.inputfields)
      .eq(1)
      .clear({ force: true })
      .click({ force: true }); //Email input
    propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{CustomersTable.selectedRow.email}}",
      true,
      false,
    );
    cy.xpath(_.EntityExplorer._entityNameInExplorer("CountryInput"))
      .first()
      .click({ force: true });

    cy.wait(1000);
    cy.get(guidedTourLocators.inputfields)
      .eq(2)
      .clear({ force: true })
      .click({ force: true }); //Country input
    propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{CustomersTable.selectedRow.country}}",
      true,
      false,
    );
    cy.xpath(_.EntityExplorer._entityNameInExplorer("DisplayImage"))
      .first()
      .click({ force: true });

    cy.get(guidedTourLocators.successButton).click();
    // Step 6: Drag and drop a widget
    cy.dragAndDropToCanvas("buttonwidget", {
      x: 845,
      y: 750,
    });
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
    // Step 7: Execute a query onClick
    cy.executeDbQuery("updateCustomerInfo", "onClick");
    // Step 8: Execute getCustomers onSuccess
    propPane.SelectActionByTitleAndValue(
      "Execute a query",
      "updateCustomerInfo.run",
    ),
      agHelper.GetNClick(propPane._actionAddCallback("success"));
    cy.get(locators._dropDownValue("Execute a query"))
      .click()
      .wait(500)
      .get("ul.bp3-menu")
      .children()
      .contains("getCustomers")
      .click({ force: true })
      .wait(500);
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    cy.get(guidedTourLocators.successButton).click();
    // Step 9: Deploy
    deployMode.DeployApp();
    cy.get(guidedTourLocators.rating).should("be.visible");
    cy.get(guidedTourLocators.rating).eq(4).click();
    cy.get(guidedTourLocators.startBuilding).should("be.visible");
    cy.get(guidedTourLocators.startBuilding).click();
  });
});
