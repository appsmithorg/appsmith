import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import {
  agHelper,
  dataSources,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  PageLeftPane,
  EntityType,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import { PluginActionForm } from "../../../../support/Pages/PluginActionForm";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("Focus Retention of Inputs", { tags: ["@tag.IDE"] }, function () {
  let pluginActionForm = new PluginActionForm();

  before("Import the test application", () => {
    homePage.NavigateToHome();
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
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
      "Container1",
    ]);

    cy.focusCodeInput(".t--property-control-text", { ch: 2, line: 0 });

    EditorNavigation.SelectEntityByName("Graphql_Query", EntityType.Api);

    cy.focusCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    PageLeftPane.selectItem("Rest_Api_1");

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Params')]").click();
    cy.focusCodeInput(apiwidget.queryKey);
    cy.wait("@saveAction");

    PageLeftPane.selectItem("Rest_Api_2");

    cy.wait(1000);
    agHelper.GetNClick("//span[contains(text(), 'Headers')]", 0);
    cy.updateCodeInput(apiwidget.headerValue, "test");
    cy.wait("@saveAction");

    PageLeftPane.selectItem("SQL_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.body", { ch: 5, line: 0 });
    cy.wait("@saveAction");

    PageLeftPane.selectItem("S3_Query");

    cy.get(".t--actionConfiguration\\.formData\\.bucket\\.data").should(
      "be.visible",
    );
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data", {
      ch: 2,
      line: 0,
    });
    cy.wait("@saveAction");

    PageLeftPane.switchSegment(PagePaneSegment.JS);

    PageLeftPane.selectItem("JSObject1");

    cy.get(".js-editor").should("be.visible");
    cy.focusCodeInput(".js-editor", { ch: 4, line: 4 });
    cy.wait("@saveAction");

    PageLeftPane.selectItem("JSObject2");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("2. Datasource edit mode has to be maintained", () => {
    EditorNavigation.SelectEntityByName("Appsmith", EntityType.Datasource);
    dataSources.EditDatasource();
    EditorNavigation.SelectEntityByName("Github", EntityType.Datasource);
    dataSources.AssertDSEditViewMode("View");
    EditorNavigation.SelectEntityByName("Appsmith", EntityType.Datasource);
    dataSources.AssertDSEditViewMode("Edit");
  });

  it("3. Maintain focus of form control inputs", () => {
    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    dataSources.ToggleUsePreparedStatement(false);
    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);

    cy.setQueryTimeout(10000);

    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    cy.get(locators._queryName).should("contain.text", "SQL_Query");
    pluginActionForm.toolbar.toggleSettings();
    agHelper.GetElement(dataSources._usePreparedStatement).should("be.focused");
    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);
    cy.get(locators._queryName).should("be.visible");
    pluginActionForm.toolbar.toggleSettings();
    cy.xpath(queryLocators.queryTimeout).should("be.focused");
  });

  it("4. Bug 21999 Maintain focus of code editor when Escape is pressed with autcomplete open + Bug 22960", () => {
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
