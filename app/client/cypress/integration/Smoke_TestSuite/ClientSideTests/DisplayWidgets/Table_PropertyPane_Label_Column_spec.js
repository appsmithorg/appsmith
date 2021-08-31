const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Table Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Table Widget Functionality", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
    cy.editColumn("status");
    cy.changeColumnType("Label");
    cy.isSelectRow(1);
    cy.enableColorOption();
    cy.openLabelColorPicker();
    cy.get(".t--colortab-0").click();
    cy.wait(200);
    cy.get(
      ".t--property-pane-section-tagcolors .t--label-colorpicker-0 .bp3-input-group div",
    ).should("have.css", "background-color", "rgb(255, 103, 134)");
  });
});
