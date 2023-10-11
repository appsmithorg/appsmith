const commonlocators = require("../../locators/commonlocators.json");
const viewWidgetsPage = require("../../locators/ViewWidgets.json");
const publishPage = require("../../locators/publishWidgetspage.json");
import * as _ from "../../support/Objects/ObjectsCore";

if (Cypress.env("APPSMITH_GOOGLE_MAPS_API_KEY")) {
  describe("excludeForAirgap", "Map Widget Functionality", function () {
    before(() => {
      _.agHelper.AddDsl("Mapdsl");
    });

    it("Map Widget Functionality", function () {
      cy.openPropertyPane("mapwidget");
      /**
       * @param{Text} Random Text
       * @param{MapWidget}Mouseover
       * @param{MapPre Css} Assertion
       */
      cy.widgetText(
        "Maptest",
        viewWidgetsPage.mapWidget,
        viewWidgetsPage.mapInner,
      );
      cy.get(viewWidgetsPage.mapinitialloc)
        .click({ force: true })
        .clear()
        .type(this.dataSet.country)
        .type("{enter}");
      cy.get(viewWidgetsPage.mapInput)
        .click({ force: true })
        .type(this.dataSet.command)
        .type(JSON.stringify(this.dataSet.marker), {
          parseSpecialCharSequences: false,
        });
      cy.get(viewWidgetsPage.zoomLevel).eq(0).click({ force: true });
      cy.get(viewWidgetsPage.zoomLevel).eq(1).click({ force: true });
      cy.get(viewWidgetsPage.mapSearch)
        .click({ force: true })
        .clear()
        .type(this.dataSet.location2)
        .type("{enter}");
    });

    it("Map-Enable Location,Map search and Create Marker Property Validation", function () {
      /**
       * Enable the Search Location checkbox and Validate the same in editor mode
       */
      cy.CheckWidgetProperties(commonlocators.enableSearchLocCheckbox);
      cy.get(viewWidgetsPage.mapSearch).should("be.visible");
      cy.get(viewWidgetsPage.mapSearch)
        .invoke("attr", "placeholder")
        .should("contain", "Enter location to search");
      /**
       * Enable the Pick Location checkbox and Validate the same in editor mode
       */
      cy.CheckWidgetProperties(commonlocators.enablePickLocCheckbox);
      cy.get(viewWidgetsPage.pickMyLocation).should("exist");

      /**
       * Enable the Createnew Marker checkbox and Validate the same in editor mode
       */
      cy.CheckWidgetProperties(commonlocators.enableCreateMarkerCheckbox);
      /**
       * Validation will be added when create marker fun is working fine
       */

      _.deployMode.DeployApp();
      /**
       * Publish mode Validation
       */
      cy.get(publishPage.mapSearch).should("be.visible");
      cy.get(publishPage.mapSearch)
        .invoke("attr", "placeholder")
        .should("contain", "Enter location to search");
      cy.get(publishPage.pickMyLocation).should("exist");
      _.deployMode.NavigateBacktoEditor();
    });

    it("Map-Disable Location, Mapsearch and Create Marker Property Validation", function () {
      cy.openPropertyPane("mapwidget");
      /**
       * Disable the Search Location checkbox and Validate the same in editor mode
       */
      cy.UncheckWidgetProperties(commonlocators.enableSearchLocCheckbox);
      cy.get(viewWidgetsPage.mapSearch).should("not.exist");
      /**
       * Disable the Pick Location checkbox and Validate the same in editor mode
       */
      cy.UncheckWidgetProperties(commonlocators.enablePickLocCheckbox);
      cy.get(viewWidgetsPage.pickMyLocation).should("not.exist");

      /**
       * Disable the Createnew Marker checkbox and Validate the same in editor mode
       */
      cy.UncheckWidgetProperties(commonlocators.enableCreateMarkerCheckbox);
      /**
       * Validation will be added when create marker fun is working fine
       */

      _.deployMode.DeployApp();
      /**
       * Publish mode Validation
       */
      cy.get(publishPage.mapSearch).should("not.exist");
      cy.get(publishPage.pickMyLocation).should("not.exist");
      _.deployMode.NavigateBacktoEditor();
    });

    it("Map-Initial location should work", function () {
      cy.openPropertyPane("mapwidget");

      cy.get(viewWidgetsPage.mapinitialloc).should(
        "have.value",
        this.dataSet.country,
      );

      /**
       * Clearing initial location used to reset it, this check makes sure it actually clears
       */
      cy.get(viewWidgetsPage.mapinitialloc)
        .click({ force: true })
        .clear()
        .should("have.value", "");
    });

    it("Map-Check Visible field Validation", function () {
      //Check the disableed checkbox and Validate
      cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.mapWidget).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("Map-Unckeck Visible field Validation", function () {
      cy.openPropertyPane("mapwidget");
      //Uncheck the disabled checkbox and validate
      cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.mapWidget).should("not.exist");
    });
  });
}
