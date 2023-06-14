const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const pageid = "MyPage";
import {
  agHelper,
  propPane,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe("Table Widget and Navigate to functionality validation", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    cy.addDsl(dsl);
    cy.wait(2000); //dsl to settle!
  });

  it("1. Create MyPage and valdiate if its successfully created", function () {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
    //Table Widget Functionality with multiple page
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Table1", "Container3");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.focused().blur();
    propPane.SelectPlatformFunction("onRowSelected", "Navigate to");
    cy.get(".t--open-dropdown-Select-page").click();
    cy.get(commonlocators.singleSelectMenuItem)
      .contains(pageid)
      .click({ force: true });
    cy.assertPageSave();
    //Validate NavigateTo Page functionality
    cy.wait(2000);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
