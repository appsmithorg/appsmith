const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const data = [
  {
    "普通话 [普通話] ": "mandarin",
    français: "french",
    español: "spanish",
    日本語: "japnese",
    हिन्दी: "hindi",
  },
];

describe(
  "Non ASCII character functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("tableV2NewDsl");
    });

    it("1. should test that Non ASCII characters in the tableData are shown in the table column header", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.UpdatePropertyFieldValue("Table data", JSON.stringify(data));
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
      _.propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRow}}");
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "",  "français": "",  "español": "",  "日本語": "",  "हिन्दी": ""}`,
      );
      _.table.SelectTableRow(0, 0, true, "v2");
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "mandarin",  "français": "french",  "español": "spanish",  "日本語": "japnese",  "हिन्दी": "hindi"}`,
      );
    });

    it("3. should test that triggeredRow also retains the non-ascii characters", () => {
      cy.openPropertyPane("textwidget");
      _.propPane.UpdatePropertyFieldValue("Text", "{{Table1.triggeredRow}}");
      cy.openPropertyPane("tablewidgetv2");
      cy.addColumnV2("button");
      cy.editColumn("customColumn1");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Button").click();
      cy.getAlert("onClick", "clicked!!");
      cy.wait(1000);
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "",  "français": "",  "español": "",  "日本語": "",  "हिन्दी": ""}`,
      );
      cy.get(`[data-colindex="5"][data-rowindex="0"] button`).trigger("click", {
        force: true,
      });
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "mandarin",  "français": "french",  "español": "spanish",  "日本語": "japnese",  "हिन्दी": "hindi"}`,
      );
    });
  },
);
