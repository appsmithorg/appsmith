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

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("Focus Retention of Inputs", { tags: ["@tag.IDE"] }, function () {
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

    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data", {
      ch: 2,
      line: 0,
    });
    cy.wait(1000);
    cy.wait("@saveAction");

    PageLeftPane.switchSegment(PagePaneSegment.JS);

    PageLeftPane.selectItem("JSObject1");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 4, line: 4 });
    cy.wait("@saveAction");

    PageLeftPane.selectItem("JSObject2");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("2. Maintains focus on property/Api/Query/Js Pane", () => {
    //Maintains focus on the property pane
    EditorNavigation.ShowCanvas();

    cy.get(".t--widget-name").should("have.text", "Text1");
    cy.assertSoftFocusOnCodeInput(".t--property-control-text", {
      ch: 2,
      line: 0,
    });

    PageLeftPane.switchSegment(PagePaneSegment.Queries);

    //Maintains focus on the API pane
    PageLeftPane.selectItem("Graphql_Query");

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Graphql_Query");

    cy.xpath("//span[contains(text(), 'Body')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    PageLeftPane.selectItem("Rest_Api_1");

    agHelper.GetElement(locators._queryName).should("have.text", "Rest_Api_1");

    cy.xpath("//span[contains(text(), 'Params')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(apiwidget.queryKey, { ch: 0, line: 0 });

    PageLeftPane.selectItem("Rest_Api_2");

    agHelper.GetElement(locators._queryName).should("have.text", "Rest_Api_2");

    cy.xpath("//span[contains(text(), 'Headers')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(apiwidget.headerValue);

    //Maintains focus on Query panes
    PageLeftPane.selectItem("SQL_Query");

    agHelper.GetElement(locators._queryName).should("have.text", "SQL_Query");

    cy.assertCursorOnCodeInput(".t--actionConfiguration\\.body", {
      ch: 5,
      line: 0,
    });

    PageLeftPane.selectItem("S3_Query");

    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.bucket\\.data",
      { ch: 2, line: 0 },
    );

    PageLeftPane.switchSegment(PagePaneSegment.JS);

    //Maintains focus on JS Objects
    PageLeftPane.selectItem("JSObject1");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 4 });

    PageLeftPane.selectItem("JSObject2");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("3. Datasource edit mode has to be maintained", () => {
    EditorNavigation.SelectEntityByName("Appsmith", EntityType.Datasource);
    dataSources.EditDatasource();
    EditorNavigation.SelectEntityByName("Github", EntityType.Datasource);
    dataSources.AssertDSEditViewMode("View");
    EditorNavigation.SelectEntityByName("Appsmith", EntityType.Datasource);
    dataSources.AssertDSEditViewMode("Edit");
  });

  it("4. Maintain focus of form control inputs", () => {
    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    dataSources.ToggleUsePreparedStatement(false);
    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);

    cy.xpath(queryLocators.querySettingsTab).click();
    cy.setQueryTimeout(10000);

    EditorNavigation.SelectEntityByName("SQL_Query", EntityType.Query);
    cy.get(".bp3-editable-text-content").should("contain.text", "SQL_Query");
    cy.xpath(queryLocators.querySettingsTab).click();
    agHelper.GetElement(dataSources._usePreparedStatement).should("be.focused");
    EditorNavigation.SelectEntityByName("S3_Query", EntityType.Query);
    agHelper.Sleep();
    cy.xpath(queryLocators.querySettingsTab).click();
    cy.xpath(queryLocators.queryTimeout).should("be.focused");
  });

  it("5. Bug 21999 Maintain focus of code editor when Escape is pressed with autcomplete open + Bug 22960", () => {
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
