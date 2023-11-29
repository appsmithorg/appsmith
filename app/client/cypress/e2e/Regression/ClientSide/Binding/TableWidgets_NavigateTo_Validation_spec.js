import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const pageid = "MyPage";
import {
  agHelper,
  propPane,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Table Widget and Navigate to functionality validation", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    agHelper.AddDsl("tableWidgetDsl");
  });

  it("1. Create MyPage and valdiate if its successfully created", function () {
    cy.Createpage(pageid);
    agHelper.AddDsl("displayWidgetDsl");
    PageLeftPane.assertPresence(pageid);
    //Table Widget Functionality with multiple page
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
      "Container3",
    ]);
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
    deployMode.DeployApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
