const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
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
  "Custom column alias functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("tableV2NewDsl");
    });

    it("1. should test that custom column has alias property", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.UpdatePropertyFieldValue("Table data", JSON.stringify(data));
      cy.wait("@updateLayout");
      cy.wait(1000);
      cy.addColumnV2("customColumn1");
      cy.editColumn("customColumn1");
      cy.get(".t--property-control-propertyname").should("exist");
      cy.get(".t--property-control-propertyname .CodeMirror-code")
        .invoke("text")
        .then((value) => {
          expect(value).to.equal("customColumn1");
        });
    });

    it("2. should test that custom alias is used in the selectedRow", () => {
      cy.dragAndDropToCanvas("textwidget", { x: 200, y: 100 });
      cy.openPropertyPane("textwidget");
      _.propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRow}}");
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("customColumn1");
      _.propPane.UpdatePropertyFieldValue("Property Name", "columnAlias");
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "",  "français": "",  "español": "",  "日本語": "",  "हिन्दी": "",  "columnAlias": ""}`,
      );
      _.table.SelectTableRow(0, 0, true, "v2");
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "mandarin",  "français": "french",  "español": "spanish",  "日本語": "japnese",  "हिन्दी": "hindi",  "columnAlias": ""}`,
      );
    });

    it("3. should test that custom alias is used in the triggeredRow", () => {
      cy.openPropertyPane("textwidget");
      _.propPane.UpdatePropertyFieldValue("Text", "{{Table1.triggeredRow}}");
      cy.openPropertyPane("tablewidgetv2");
      cy.backFromPropertyPanel();
      cy.get(widgetsPage.addColumn).scrollIntoView();
      cy.get(widgetsPage.addColumn).click({ force: true });
      cy.wait(500);
      cy.editColumn("customColumn2");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Button").click();
      cy.getAlert("onClick", "clicked!!");
      cy.wait(1000);
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "",  "français": "",  "español": "",  "日本語": "",  "हिन्दी": "",  "columnAlias": ""}`,
      );
      cy.get(`[data-colindex="6"][data-rowindex="0"] button`).trigger("click", {
        force: true,
      });
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "普通话 [普通話] ": "mandarin",  "français": "french",  "español": "spanish",  "日本語": "japnese",  "हिन्दी": "hindi",  "columnAlias": ""}`,
      );
    });
  },
);
