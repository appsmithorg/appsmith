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
const GRID_ROW_HEIGHT = 10;

// SimpleBar's scroll element and the shared auto height wrapper only expose classes
const tableWidget = locators._widgetInDeployed(draggableWidgets.TABLE);
const staticBody = `${tableWidget} [data-testid="t--table-v2-static-body"]`;
const autoHeightLocators = {
  tableWidget,
  dataRows: `${staticBody} [data-rowindex]:not([data-colindex])`,
  emptyRows: `${staticBody} [data-testid="t--table-v2-empty-row"]`,
  bodyScrollWrapper: `${staticBody} .simplebar-content-wrapper`,
  autoHeightScrollContainer: `${tableWidget} .auto-height-scroll-container`,
  pageSizeText: getWidgetSelector(draggableWidgets.TEXT),
  rowsPerPageControl: propPane._propertyControl("rowsperpage"),
  shortRowHeight: `${propPane._propertyControl("defaultrowheight")} [data-value="SHORT"]`,
};

const readPageSize = () =>
  cy
    .get(autoHeightLocators.pageSizeText)
    .invoke("text")
    .then((text) => Number(text.trim()));

const assertPageSize = (assertion: (pageSize: number) => void) => {
  cy.get(autoHeightLocators.pageSizeText).should(($text) => {
    assertion(Number($text.text().trim()));
  });
};

const setRowsPerPage = (rows: number) => {
  propPane.UpdatePropertyFieldValue("Rows per page", String(rows));
  assertPageSize((pageSize) => expect(pageSize).to.eq(rows));
  agHelper.AssertElementLength(autoHeightLocators.dataRows, rows);
};

// Auto height resizes after a short debounce, so the height check retries
const assertTableGrowsAfter = (action: () => void) => {
  cy.get(autoHeightLocators.tableWidget)
    .invoke("height")
    .then((previousHeight) => {
      action();
      cy.get(autoHeightLocators.tableWidget).should(($table) => {
        expect(Number($table.height())).to.be.greaterThan(
          Number(previousHeight),
        );
      });
    });
};

const selectTable = () => {
  agHelper.GetNClick(autoHeightLocators.tableWidget);
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
      agHelper.AssertElementAbsence(autoHeightLocators.rowsPerPageControl);
    });

    it("2. Auto Height shows Rows per page rows and resizes the widget", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      agHelper.AssertElementVisibility(autoHeightLocators.rowsPerPageControl);

      setRowsPerPage(1);
      assertTableGrowsAfter(() => setRowsPerPage(5));
      assertTableGrowsAfter(() => setRowsPerPage(15));
    });

    it("3. Auto Height table body does not scroll vertically", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(15);
      cy.get(autoHeightLocators.bodyScrollWrapper).should(($wrapper) => {
        expect($wrapper[0].scrollHeight).to.be.at.most(
          $wrapper[0].clientHeight,
        );
      });
    });

    it("4. Auto Height table renders no filler rows for short data", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(5);
      propPane.EnterJSContext(
        "Table data",
        JSON.stringify(tableData.slice(0, 2)),
      );
      agHelper.AssertElementLength(autoHeightLocators.dataRows, 2);
      agHelper.AssertElementAbsence(autoHeightLocators.emptyRows);
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
          cy.get(autoHeightLocators.tableWidget).should(($table) => {
            expect(Number($table.height())).to.be.at.most(
              maxHeightInRows * GRID_ROW_HEIGHT,
            );
          });
          // The rows that do not fit scroll inside the outer auto height container
          cy.get(autoHeightLocators.autoHeightScrollContainer).should(
            ($container) => {
              expect($container[0].scrollHeight).to.be.greaterThan(
                $container[0].clientHeight,
              );
            },
          );
          cy.get(autoHeightLocators.autoHeightScrollContainer).scrollTo(
            "bottom",
          );
          cy.get(autoHeightLocators.autoHeightScrollContainer).should(
            ($container) => {
              expect($container[0].scrollTop).to.be.greaterThan(0);
            },
          );
        });
    });

    it("6. Switching back to Fixed derives the page size from the height again", function () {
      selectTable();
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      setRowsPerPage(5);
      propPane.SelectPropertiesDropDown("Height", "Fixed");
      agHelper.AssertElementAbsence(autoHeightLocators.rowsPerPageControl);

      // In Fixed mode a shorter row height fits more rows in the same height
      readPageSize().then((fixedPageSize) => {
        propPane.MoveToTab("Style");
        agHelper.GetNClick(autoHeightLocators.shortRowHeight);
        assertPageSize((pageSize) => {
          expect(pageSize).to.be.greaterThan(fixedPageSize);
        });
        propPane.MoveToTab("Content");
      });
    });
  },
);
