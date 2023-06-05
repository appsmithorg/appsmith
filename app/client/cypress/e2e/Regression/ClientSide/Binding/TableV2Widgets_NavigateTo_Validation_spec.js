const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const pageid = "MyPage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Table Widget V2 and Navigate to functionality validation", function () {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    cy.fixture("tableV2WidgetDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Create MyPage and validate if its successfully created", function () {
    cy.Createpage(pageid);
    cy.fixture("displayWidgetDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
    //Table Widget V2 Functionality with multiple page
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.openPropertyPane("tablewidgetv2");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidgetV2,
      widgetsPage.widgetNameSpan,
    );
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.focused().blur();
    _.propPane.SelectPlatformFunction("onRowSelected", "Navigate to");
    cy.get(".t--open-dropdown-Select-page").click();
    cy.get(commonlocators.singleSelectMenuItem)
      .contains(pageid)
      .click({ force: true });
    cy.assertPageSave();
  });

  it("2. Validate NavigateTo Page functionality ", function () {
    cy.wait(2000);
    _.deployMode.DeployApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
