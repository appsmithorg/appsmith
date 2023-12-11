import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const pageid = "MyPage";
import {
  entityExplorer,
  agHelper,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget with Input Widget and Navigate to functionality validation",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("navigateTotabledsl");
    });

    it("1. Table Widget Functionality with multiple page", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.widgetText(
        "Table1",
        widgetsPage.tableWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
      //Create MyPage and valdiate if its successfully created
      cy.Createpage(pageid);
      agHelper.AddDsl("navigateToInputDsl");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      EditorNavigation.SelectEntityByName(pageid, EntityType.Page);
    });

    it("2. Validate NavigateTo Page functionality ", function () {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      cy.wait(4000);
      deployMode.DeployApp();
      cy.readTabledataPublish("1", "0").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.log(tabValueP);
        cy.isSelectRow(1);
        cy.get("input").should("be.visible");
        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValueP);
      });
    });
  },
);
