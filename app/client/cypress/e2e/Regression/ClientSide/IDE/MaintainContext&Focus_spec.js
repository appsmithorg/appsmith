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
  EntityType,
  AppSidebarButton,
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
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
      "Container1",
    ]);

    cy.focusCodeInput(".t--property-control-text", { ch: 2, line: 0 });

    EditorNavigation.SelectEntityByName("Graphql_Query", EntityType.Api);

    cy.focusCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    EditorNavigation.SelectEntityByName("Rest_Api_1", EntityType.Api);

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Params')]").click();
    cy.focusCodeInput(apiwidget.queryKey);
    cy.wait("@saveAction");

    EditorNavigation.SelectEntityByName("Rest_Api_2", EntityType.Api);

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Headers')]").click();
    cy.updateCodeInput(apiwidget.headerValue, "test");
    cy.wait("@saveAction");

    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.body", { ch: 5, line: 0 });
    cy.wait("@saveAction");

    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);

    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data", {
      ch: 2,
      line: 0,
    });
    cy.wait(1000);
    cy.wait("@saveAction");

    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 4, line: 4 });
    cy.wait("@saveAction");

    EditorNavigation.SelectEntityByName("JSObject2", EntityType.JSObject);

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 2, line: 2 });

    EditorNavigation.SelectEntityByName("Mongo_Query", EntityType.Query);

    cy.wait(1000);
    dataSources.EnterJSContext({
      fieldLabel: "Collection",
      fieldValue: "TestCollection",
    });
    cy.wait("@saveAction");
  });

  it("2. Maintains focus on property/Api/Query/Js Pane", () => {
    //Maintains focus on the property pane
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

    cy.get(".t--widget-name").should("have.text", "Text1");
    cy.assertSoftFocusOnCodeInput(".t--property-control-text", {
      ch: 2,
      line: 0,
    });

    //Maintains focus on the API pane
    EditorNavigation.SelectEntityByName("Graphql_Query", EntityType.Api);

    cy.xpath("//span[contains(text(), 'Body')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    EditorNavigation.SelectEntityByName("Rest_Api_1", EntityType.Api);
    // cy.assertCursorOnCodeInput(apiwidget.headerValue);

    EditorNavigation.SelectEntityByName("Rest_Api_2", EntityType.Api);

    cy.xpath("//span[contains(text(), 'Headers')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(apiwidget.headerValue);

    //Maintains focus on Query panes
    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);

    cy.assertCursorOnCodeInput(".t--actionConfiguration\\.body", {
      ch: 5,
      line: 0,
    });

    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);

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
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 4 });

    EditorNavigation.SelectEntityByName("JSObject2", EntityType.JSObject);

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("3. Check if selected tab on right tab persists", () => {
    EditorNavigation.SelectEntityByName("Rest_Api_1", EntityType.Api);
    apiPage.SelectRightPaneTab("Connections");
    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    EditorNavigation.SelectEntityByName("Rest_Api_1", EntityType.Api);
    apiPage.AssertRightPaneSelectedTab("Connections");

    //Check if the URL is persisted while switching pages
    cy.Createpage("Page2");

    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    EditorNavigation.SelectEntityByName("Rest_Api_1", EntityType.Api);

    EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });

    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    cy.get(".t--nameOfApi .bp3-editable-text-content").should(
      "contain",
      "Rest_Api_1",
    );
  });

  it("4. Datasource edit mode has to be maintained", () => {
    EditorNavigation.SelectEntityByName("Appsmith", EntityType.Datasource);
    dataSources.EditDatasource();
    EditorNavigation.SelectEntityByName("Github", EntityType.Datasource);
    dataSources.AssertDSEditViewMode("View");
    EditorNavigation.SelectEntityByName("Appsmith", EntityType.Datasource);
    dataSources.AssertDSEditViewMode("Edit");
  });

  it("5. Maintain focus of form control inputs", () => {
    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    dataSources.ToggleUsePreparedStatement(false);
    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);

    cy.xpath(queryLocators.querySettingsTab).click();
    cy.setQueryTimeout(10000);

    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    cy.get(".bp3-editable-text-content").should("contain.text", "SQL_Query");
    cy.get(".t--form-control-SWITCH input").should("be.focused");
    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);
    agHelper.Sleep();
    cy.xpath(queryLocators.querySettingsTab).click();
    cy.xpath(queryLocators.queryTimeout).should("be.focused");
  });

  it("6. Bug 21999 Maintain focus of code editor when Escape is pressed with autcomplete open + Bug 22960", () => {
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);

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
