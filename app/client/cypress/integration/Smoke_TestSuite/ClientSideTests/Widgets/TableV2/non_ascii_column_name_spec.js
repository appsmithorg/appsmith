const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const propPane = ObjectsRegistry.PropertyPane;
const data = [
  {
    "普通话 [普通話] ": "mandarin",
    français: "french",
    español: "spanish",
    日本語: "japnese",
    हिन्दी: "hindi",
  },
];

describe("Non ASCII character functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. should test that Non ASCII characters in the tableData are shown in the table column header", () => {
    cy.openPropertyPane("tablewidgetv2");
    propPane.UpdatePropertyFieldValue("Table Data", JSON.stringify(data));
    cy.wait("@updateLayout");
    Object.keys(data[0]).forEach((column) => {
      cy.get(
        `.t--widget-tablewidgetv2 .thead .th[data-header="${column}"]`,
      ).should("exist");
    });
  });

  it("2. should test that selectedRow also retains the non-ascii characters", () => {
    cy.dragAndDropToCanvas("textwidget", { x: 200, y: 100 });
    cy.openPropertyPane("textwidget");
    propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRow}}");
    cy.get(".t--widget-textwidget .bp3-ui-text").should(
      "contain",
      `{  "普通话 [普通話] ": "",  "français": "",  "español": "",  "日本語": "",  "हिन्दी": ""}`,
    );
    cy.isSelectRow(0);
    cy.get(".t--widget-textwidget .bp3-ui-text").should(
      "contain",
      `{  "普通话 [普通話] ": "mandarin",  "français": "french",  "español": "spanish",  "日本語": "japnese",  "हिन्दी": "hindi"}`,
    );
  });

  it("3. should test that triggeredRow also retains the non-ascii characters", () => {
    cy.openPropertyPane("textwidget");
    propPane.UpdatePropertyFieldValue("Text", "{{Table1.triggeredRow}}");
    cy.openPropertyPane("tablewidgetv2");
    cy.addColumnV2("button");
    cy.editColumn("customColumn1");
    cy.get(commonlocators.changeColType)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("Button")
      .click();
    cy.get(".t--property-control-onclick .t--open-dropdown-Select-Action")
      .last()
      .click();
    cy.selectShowMsg();
    cy.addSuccessMessage("clicked!!", ".t--property-control-onsave");
    cy.wait(1000);
    cy.get(".t--widget-textwidget .bp3-ui-text").should(
      "contain",
      `{  "普通话 [普通話] ": "",  "français": "",  "español": "",  "日本語": "",  "हिन्दी": "",  "customColumn1": ""}`,
    );
    cy.get(`[data-colindex="5"][data-rowindex="0"] button`).trigger("click", {
      force: true,
    });
    cy.get(".t--widget-textwidget .bp3-ui-text").should(
      "contain",
      `{  "普通话 [普通話] ": "mandarin",  "français": "french",  "español": "spanish",  "日本語": "japnese",  "हिन्दी": "hindi",  "customColumn1": ""}`,
    );
  });
});
