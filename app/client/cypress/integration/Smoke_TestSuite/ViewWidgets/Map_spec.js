const commonlocators = require("../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../locators/ViewWidgets.json");
const dsl = require("../../../fixtures/Mapdsl.json");

describe("Map Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Map Widget Functionality", function() {
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
      .type(this.data.country)
      .type("{enter}");
    cy.get(viewWidgetsPage.mapInput)
      .click({ force: true })
      .type(this.data.command)
      .type(JSON.stringify(this.data.marker), {
        parseSpecialCharSequences: false,
      });
    cy.get(viewWidgetsPage.zoomLevel)
      .eq(0)
      .click({ force: true });
    cy.get(viewWidgetsPage.zoomLevel)
      .eq(1)
      .click({ force: true });
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.mapOptionChange);
    cy.get(viewWidgetsPage.mapSearch).should("be.visible");
    cy.get(viewWidgetsPage.mapSearch)
      .invoke("attr", "placeholder")
      .should("contain", "Enter location to search");
    cy.get(viewWidgetsPage.mapSearch)
      .click({ force: true })
      .clear()
      .type(this.data.location2)
      .type("{enter}");
  });
  afterEach(() => {
    // put your clean up code if any
  });
});
