import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../.././../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";
const dsl = require("../../../../../fixtures/tableAndTextDsl.json");

describe(
  "Table Widget Filtered Table data in autocomplete",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableAndTextDsl");
    });

    it("Table Widget Functionality To Filter and search data", function () {
      cy.openPropertyPane("tablewidget");
      cy.get(publish.searchInput).first().type("query");
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue).contains("task").click();
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue).contains("contains").click();
      cy.get(publish.inputValue).type("bind");
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.get(".t--close-filter-btn").click({ force: true });
    });

    it("Table Widget Functionality to validate filtered table data", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      cy.testJsontext("text", "{{Table1.filteredTableData[0].task}}");
      cy.readTabledata("0", "1").then((tabData) => {
        const tableData = tabData;
        cy.get(commonlocators.labelTextStyle).should("have.text", tableData);
      });

      //Table Widget Functionality to validate filtered table data with actual table data
      cy.readTabledata("0", "1").then((tabData) => {
        const tableData = JSON.parse(dsl.dsl.children[0].tableData);
        cy.get(commonlocators.labelTextStyle).should(
          "have.text",
          tableData[2].task,
        );
      });
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
