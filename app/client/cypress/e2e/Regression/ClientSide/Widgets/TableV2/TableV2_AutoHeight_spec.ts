import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

const tableData = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  name: `Name ${index + 1}`,
}));
const tableWidget = locators._widgetInDeployed(draggableWidgets.TABLE);
const tableRows = `${tableWidget} .tbody .tr`;
const rowsPerPageControl = propPane._propertyControl("rowsperpage");

const assertPageSize = (expected: string) => {
  agHelper.GetText(getWidgetSelector(draggableWidgets.TEXT)).then(($text) => {
    expect($text).to.eq(expected);
  });
};

describe(
  "Table widget v2: auto height",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.AutoHeight"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 100);
      propPane.UpdatePropertyFieldValue("Text", "{{Table1.pageSize}}");
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
      propPane.EnterJSContext("Table data", JSON.stringify(tableData));
    });

    it("1. Height defaults to Fixed and Rows per page is hidden", function () {
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Fixed");
      agHelper.AssertElementAbsence(rowsPerPageControl);
    });

    it("2. Auto Height shows Rows per page rows and resizes the widget", function () {
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      agHelper.AssertElementVisibility(rowsPerPageControl);

      propPane.UpdatePropertyFieldValue("Rows per page", "5");
      assertPageSize("5");
      agHelper.AssertElementLength(tableRows, 5);

      agHelper.GetHeight(tableWidget);
      cy.get("@eleHeight").then(($fiveRowsHeight) => {
        propPane.UpdatePropertyFieldValue("Rows per page", "15");
        assertPageSize("15");
        agHelper.AssertElementLength(tableRows, 15);

        agHelper.GetHeight(tableWidget);
        cy.get("@eleHeight").then(($fifteenRowsHeight) => {
          expect(Number($fifteenRowsHeight)).to.be.greaterThan(
            Number($fiveRowsHeight),
          );
        });
      });
    });

    it("3. Auto Height table has no inner vertical scrollbar", function () {
      cy.get(`${tableWidget} .simplebar-track.simplebar-vertical`).should(
        "not.be.visible",
      );
    });

    it("4. Auto Height table renders no filler rows for short data", function () {
      propPane.EnterJSContext(
        "Table data",
        JSON.stringify(tableData.slice(0, 2)),
      );
      agHelper.AssertElementLength(tableRows, 2);
    });

    it("5. Auto Height with limits never grows above the max height", function () {
      propPane.EnterJSContext("Table data", JSON.stringify(tableData));
      propPane.SelectPropertiesDropDown("Height", "Auto Height with limits");
      propPane.UpdatePropertyFieldValue("Rows per page", "25");
      assertPageSize("25");
      // Content taller than the max height scrolls inside the outer auto height container
      cy.get(`${tableWidget} .auto-height-scroll-container`).should(
        "have.css",
        "overflow-y",
        "auto",
      );
    });

    it("6. Switching back to Fixed derives the page size from the height again", function () {
      propPane.SelectPropertiesDropDown("Height", "Fixed");
      agHelper.AssertElementAbsence(rowsPerPageControl);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($text) => {
          expect($text).not.to.eq("25");
        });
    });
  },
);
