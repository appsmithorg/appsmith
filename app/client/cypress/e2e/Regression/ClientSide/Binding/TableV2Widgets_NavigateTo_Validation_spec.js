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

describe("Table Widget V2 and Navigate to functionality validation", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    agHelper.AddDsl("tableV2WidgetDsl");
  });

  it("1. Create MyPage and validate if its successfully created", function () {
    cy.Createpage(pageid);
    agHelper.AddDsl("displayWidgetDsl");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    PageLeftPane.expandCollapseItem("Pages");
    PageLeftPane.assertPresence(pageid);
    //Table Widget V2 Functionality with multiple page
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
      "Container3",
    ]);
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidgetV2,
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
  });

  it("2. Validate NavigateTo Page functionality ", function () {
    cy.wait(2000);
    deployMode.DeployApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
