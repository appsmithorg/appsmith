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
const GRID_ROW_HEIGHT = 10;

const assertPageSize = (assertion: (pageSize: number) => void) => {
  cy.get(getWidgetSelector(draggableWidgets.TEXT)).should(($text) => {
    assertion(Number($text.text().trim()));
  });
};

const setRowsPerPage = (rows: number) => {
  propPane.UpdatePropertyFieldValue("Rows per page", String(rows));
  assertPageSize((pageSize) => expect(pageSize).to.eq(rows));
  agHelper.AssertElementLength(tableRows, rows);
};

const selectTable = () => {
  agHelper.GetNClick(tableWidget);
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
      selectTable();
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Fixed");
      agHelper.AssertElementAbsence(rowsPerPageControl);
    });

    it("2. Auto Height shows Rows per page rows and resizes the widget", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      agHelper.AssertElementVisibility(rowsPerPageControl);

      setRowsPerPage(1);
      agHelper.GetHeight(tableWidget);
      cy.get("@eleHeight").then(($oneRowHeight) => {
        setRowsPerPage(5);
        agHelper.GetHeight(tableWidget);
        cy.get("@eleHeight").then(($fiveRowsHeight) => {
          expect(Number($fiveRowsHeight)).to.be.greaterThan(
            Number($oneRowHeight),
          );

          setRowsPerPage(15);
          agHelper.GetHeight(tableWidget);
          cy.get("@eleHeight").then(($fifteenRowsHeight) => {
            expect(Number($fifteenRowsHeight)).to.be.greaterThan(
              Number($fiveRowsHeight),
            );
          });
        });
      });
    });

    it("3. Auto Height table body does not scroll vertically", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(15);
      cy.get(`${tableWidget} .tableWrap .simplebar-content-wrapper`).should(
        ($wrapper) => {
          expect($wrapper[0].scrollHeight).to.be.at.most(
            $wrapper[0].clientHeight,
          );
        },
      );
    });

    it("4. Auto Height table renders no filler rows for short data", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(5);
      propPane.EnterJSContext(
        "Table data",
        JSON.stringify(tableData.slice(0, 2)),
      );
      agHelper.AssertElementLength(tableRows, 2);
      propPane.EnterJSContext("Table data", JSON.stringify(tableData));
    });

    it("5. Auto Height with limits never grows above the max height", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(5);
      propPane.SelectPropertiesDropDown("Height", "Auto Height with limits");

      agHelper.HoverElement(propPane._autoHeightLimitMax);
      cy.contains(/Max-Height: \d+ rows/)
        .invoke("text")
        .then((label) => {
          const maxHeightInRows = Number(
            /Max-Height: (\d+) rows/.exec(label)?.[1],
          );

          expect(maxHeightInRows).to.be.greaterThan(0);

          setRowsPerPage(25);
          agHelper.GetHeight(tableWidget);
          cy.get("@eleHeight").then(($clampedHeight) => {
            expect(Number($clampedHeight)).to.be.at.most(
              maxHeightInRows * GRID_ROW_HEIGHT,
            );
          });
          // The rows that do not fit scroll inside the outer auto height container
          cy.get(`${tableWidget} .auto-height-scroll-container`)
            .should("have.css", "overflow-y", "auto")
            .and(($container) => {
              expect($container[0].scrollHeight).to.be.greaterThan(
                $container[0].clientHeight,
              );
            });
        });
    });

    it("6. Switching back to Fixed derives the page size from the height again", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(5);
      propPane.SelectPropertiesDropDown("Height", "Fixed");
      agHelper.AssertElementAbsence(rowsPerPageControl);

      // In Fixed mode a shorter row height fits more rows in the same height
      cy.get(getWidgetSelector(draggableWidgets.TEXT))
        .invoke("text")
        .then((fixedPageSize) => {
          propPane.MoveToTab("Style");
          agHelper.GetNClick(
            ".t--property-control-defaultrowheight .ads-v2-segmented-control__segments-container:nth-child(1)",
          );
          assertPageSize((pageSize) => {
            expect(pageSize).to.be.greaterThan(Number(fixedPageSize.trim()));
          });
          propPane.MoveToTab("Content");
        });
    });
  },
);
