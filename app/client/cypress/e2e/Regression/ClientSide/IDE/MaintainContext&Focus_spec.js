import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import {
  agHelper,
  apiPage,
  dataSources,
  entityExplorer,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  SidebarButton,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("MaintainContext&Focus", function () {
  before("Import the test application", () => {
    homePage.CreateNewWorkspace("MaintainContext&Focus", true);
    homePage.ImportApp("ContextSwitching.json");
    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      cy.log("isPartialImport is", isPartialImport);
      if (isPartialImport) {
        // should reconnect modal
        cy.get("body").then(($ele) => {
          if ($ele.find(reconnectDatasourceModal.SkipToAppBtn))
            agHelper.GetNClick(reconnectDatasourceModal.SkipToAppBtn, 0, true);
          else agHelper.ClickButton("Got it");
          agHelper.Sleep(2000);
        });
      } else {
        homePage.AssertImportToast();
      }
    });
  });

  it("1. Focus on different entities", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container1", "Widgets");
    entityExplorer.SelectEntityByName("Text1");

    cy.focusCodeInput(".t--property-control-text", { ch: 2, line: 0 });

    entityExplorer.SelectEntityByName("Graphql_Query");

    cy.focusCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    entityExplorer.SelectEntityByName("Rest_Api_1");

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Params')]").click();
    cy.focusCodeInput(apiwidget.queryKey);
    cy.wait("@saveAction");

    entityExplorer.SelectEntityByName("Rest_Api_2");

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Headers')]").click();
    cy.updateCodeInput(apiwidget.headerValue, "test");
    cy.wait("@saveAction");

    entityExplorer.SelectEntityByName("SQL_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.body", { ch: 5, line: 0 });
    cy.wait("@saveAction");

    entityExplorer.SelectEntityByName("S3_Query");

    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data", {
      ch: 2,
      line: 0,
    });
    cy.wait(1000);
    cy.wait("@saveAction");

    entityExplorer.SelectEntityByName("JSObject1");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 4, line: 4 });
    cy.wait("@saveAction");

    entityExplorer.SelectEntityByName("JSObject2");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 2, line: 2 });

    entityExplorer.SelectEntityByName("Mongo_Query");

    cy.wait(1000);
    dataSources.EnterJSContext({
      fieldLabel: "Collection",
      fieldValue: "TestCollection",
    });
    cy.wait("@saveAction");
  });

  it("2. Maintains focus on property/Api/Query/Js Pane", () => {
    //Maintains focus on the property pane
    cy.get(`.t--entity-name:contains("Page1")`).click();

    cy.get(".t--widget-name").should("have.text", "Text1");
    cy.assertSoftFocusOnCodeInput(".t--property-control-text", {
      ch: 2,
      line: 0,
    });

    //Maintains focus on the API pane
    entityExplorer.SelectEntityByName("Graphql_Query");

    cy.xpath("//span[contains(text(), 'Body')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    entityExplorer.SelectEntityByName("Rest_Api_1");
    // cy.assertCursorOnCodeInput(apiwidget.headerValue);

    entityExplorer.SelectEntityByName("Rest_Api_2");

    cy.xpath("//span[contains(text(), 'Headers')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(apiwidget.headerValue);

    //Maintains focus on Query panes
    entityExplorer.SelectEntityByName("SQL_Query");

    cy.assertCursorOnCodeInput(".t--actionConfiguration\\.body", {
      ch: 5,
      line: 0,
    });

    entityExplorer.SelectEntityByName("S3_Query");

    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.bucket\\.data",
      { ch: 2, line: 0 },
    );

    // Removing as the Mongo collection is now converted to dropdown
    // entityExplorer.SelectEntityByName("Mongo_Query");

    // cy.assertCursorOnCodeInput(
    //   ".t--actionConfiguration\\.formData\\.collection\\.data",
    // );

    //Maintains focus on JS Objects
    entityExplorer.SelectEntityByName("JSObject1");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 4 });

    entityExplorer.SelectEntityByName("JSObject2");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("3. Check if selected tab on right tab persists", () => {
    entityExplorer.SelectEntityByName("Rest_Api_1", "Queries/JS");
    apiPage.SelectRightPaneTab("Connections");
    entityExplorer.SelectEntityByName("SQL_Query");
    entityExplorer.SelectEntityByName("Rest_Api_1");
    apiPage.AssertRightPaneSelectedTab("Connections");

    //Check if the URL is persisted while switching pages
    cy.Createpage("Page2");

    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Rest_Api_1", "Queries/JS");

    entityExplorer.SelectEntityByName("Page2", "Pages");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });

    entityExplorer.SelectEntityByName("Page1", "Pages");
    cy.get(".t--nameOfApi .bp3-editable-text-content").should(
      "contain",
      "Rest_Api_1",
    );
  });

  it("4. Datasource edit mode has to be maintained", () => {
    dataSources.navigateToDatasource("Appsmith");
    dataSources.EditDatasource();
    dataSources.navigateToDatasource("Github");
    dataSources.AssertDSEditViewMode("View");
    dataSources.navigateToDatasource("Appsmith");
    dataSources.AssertDSEditViewMode("Edit");
  });

  it("5. Maintain focus of form control inputs", () => {
    EditorNavigation.ViaSidebar(SidebarButton.Pages);
    entityExplorer.SelectEntityByName("SQL_Query");
    dataSources.ToggleUsePreparedStatement(false);
    entityExplorer.SelectEntityByName("S3_Query");

    cy.xpath(queryLocators.querySettingsTab).click();
    cy.setQueryTimeout(10000);

    entityExplorer.SelectEntityByName("SQL_Query");
    cy.get(".bp3-editable-text-content").should("contain.text", "SQL_Query");
    cy.get(".t--form-control-SWITCH input").should("be.focused");
    entityExplorer.SelectEntityByName("S3_Query");
    agHelper.Sleep();
    cy.xpath(queryLocators.querySettingsTab).click();
    cy.xpath(queryLocators.queryTimeout).should("be.focused");
  });

  it("6. Bug 21999 Maintain focus of code editor when Escape is pressed with autcomplete open + Bug 22960", () => {
    entityExplorer.SelectEntityByName("JSObject1");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 4 });
    cy.get(locators._codeMirrorTextArea).type("showA");
    agHelper.GetNAssertElementText(locators._hints, "showAlert");
    agHelper.PressEscape();
    cy.assertCursorOnCodeInput(".js-editor", { ch: 7, line: 4 });

    //Bug 22960 Maintain focus of code editor when Escape is pressed
    agHelper.PressEscape();
    cy.assertCursorOnCodeInput(".js-editor", { ch: 7, line: 4 });
  });
});
