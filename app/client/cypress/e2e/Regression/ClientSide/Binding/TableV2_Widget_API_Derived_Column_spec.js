import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const widgetsPage = require("../../../../locators/Widgets.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  table,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test Create Api and Bind to Table widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2TextPaginationDsl");
    });

    it("1. Validate TableV2 with API data and then add a column", function () {
      apiPage.CreateAndFillApi(
        this.dataSet.paginationUrl + this.dataSet.paginationParam,
      );
      agHelper.VerifyEvaluatedValue(
        this.dataSet.paginationUrl + "mock-api?records=20&page=1&size=10",
      );
      apiPage.RunAPI();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Table data", "{{Api1.data}}");
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRow.url}}");

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.ReadTableRowColumnData(0, 4, "v2").then(($fifthCellData) => {
        expect($fifthCellData).to.equal("1");
      });
      cy.addColumnV2("CustomColumn");
      cy.editColumn("customColumn1");
      cy.editColName("UpdatedColName");
      table.ReadTableRowColumnData(0, 5, "v2").then(($tabValue) => {
        cy.updateComputedValueV2(testdata.currentRowEmail);
        cy.readTableV2dataPublish(0, 5, "v2").then(($tabData) => {
          expect($tabData).to.be.equal($tabValue);
          cy.log("computed value of plain text " + $tabData);
        });
      });
      cy.closePropertyPane();
    });

    it("2. Check Image alignment is working as expected", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      cy.editColumn("avatar");
      cy.changeColumnType("Image");
      cy.closePropertyPane();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.backFromPropertyPanel();
      cy.moveToStyleTab();
      cy.xpath(widgetsPage.textCenterAlign).first().click({ force: true });
      cy.closePropertyPane();
      cy.get(`.t--widget-tablewidgetv2 .tbody .image-cell-wrapper`)
        .first()
        .should("have.css", "justify-content", "center");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.moveToStyleTab();
      cy.xpath(widgetsPage.rightAlign).first().click({ force: true });
      cy.closePropertyPane();
      cy.get(`.t--widget-tablewidgetv2 .tbody .image-cell-wrapper`)
        .first()
        .should("have.css", "justify-content", "flex-end");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.moveToStyleTab();
      cy.xpath(widgetsPage.leftAlign).first().click({ force: true });
      cy.closePropertyPane();
      cy.get(`.t--widget-tablewidgetv2 .tbody .image-cell-wrapper`)
        .first()
        .should("have.css", "justify-content", "flex-start");
    });

    it("3. Update table json data and check the derived column values after update", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.moveToContentTab();
      cy.tableV2ColumnDataValidation("id");
      cy.tableV2ColumnDataValidation("name");
      cy.tableV2ColumnDataValidation("status");
      cy.tableV2ColumnDataValidation("gender");
      cy.tableV2ColumnDataValidation("avatar");
      cy.tableV2ColumnDataValidation("email");
      cy.tableV2ColumnDataValidation("address");
      cy.tableV2ColumnDataValidation("customColumn1");
      cy.testJsontext(
        "tabledata",
        JSON.stringify(this.dataSet.TableInputUpdate),
      );
      cy.wait("@updateLayout");
      cy.tableV2ColumnDataValidation("id");
      cy.tableV2ColumnDataValidation("email");
      cy.tableV2ColumnDataValidation("userName");
      cy.tableV2ColumnDataValidation("productName");
      cy.tableV2ColumnDataValidation("orderAmount");
      cy.tableV2ColumnDataValidation("customColumn1");
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      cy.hideColumn("orderAmount");
      cy.get(".draggable-header:contains('UpdatedColName')")
        .scrollIntoView()
        .should("be.visible");
      cy.readTableV2dataPublish("1", "2").then((tabData) => {
        const tabValue = tabData;
        cy.readTableV2dataPublish("1", "2").then((tabData) => {
          cy.log("computed value of plain text " + tabData);
          expect(tabData).to.be.equal(tabValue);
        });
        cy.closePropertyPane();
      });
    });
  },
);
