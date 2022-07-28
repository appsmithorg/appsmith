const ObjectsRegistry = require("../../../../../support/Objects/Registry")
  .ObjectsRegistry;
let propPane = ObjectsRegistry.PropertyPane;
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Table Widget V2 property pane feature validation", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("1. Test to validate text color and text background", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Click on text color input field
    cy.selectColor("textcolor");

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    // Verify the text color is green
    cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(126, 34, 206)");
    // Change the text color and enter purple in input field
    cy.get(widgetsPage.textColor)
      .scrollIntoView()
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    // Verify the text color is purple
    cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
    // Click on cell background color
    cy.selectColor("cellbackgroundcolor");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // select the green color

    cy.wait("@updateLayout");
    cy.assertPageSave();
    cy.PublishtheApp();
    cy.wait(4000);

    // Verify the cell background color is green
    cy.readTableV2dataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(126, 34, 206)",
    );
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("tablewidgetv2");

    // Change the cell background color and enter purple in input field
    cy.get(`${widgetsPage.cellBackground} input`)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    cy.assertPageSave();
    cy.PublishtheApp();
    cy.wait(4000);

    // Verify the cell background color is purple
    cy.readTableV2dataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(128, 0, 128)",
    );
    cy.get(publish.backToEditor).click();
  });

  it("2. check background of the edit action column", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("id");
    cy.readTableV2dataValidateCSS(0, 5, "background-color", "rgba(0, 0, 0, 0)");
    cy.get(".t--property-control-cellbackgroundcolor")
      .find(".t--js-toggle")
      .click();
    propPane.UpdatePropertyFieldValue(
      "Cell Background Color",
      "rgb(255, 0, 0)",
    );
    cy.readTableV2dataValidateCSS(0, 5, "background-color", "rgb(255, 0, 0)");
  });
});
