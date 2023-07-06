import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("MaintainContext&Focus", function () {
  before("Import the test application", () => {
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("ContextSwitching.json");
    cy.wait("@importNewApplication").then((interception) => {
      _.agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect modal
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      } else {
        _.homePage.AssertImportToast();
      }
    });
  });

  it("1. Focus on different entities", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("Container1", "Widgets");
    _.entityExplorer.SelectEntityByName("Text1");

    cy.focusCodeInput(".t--property-control-text", { ch: 2, line: 0 });

    _.entityExplorer.SelectEntityByName("Graphql_Query");

    cy.focusCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    _.entityExplorer.SelectEntityByName("Rest_Api_1");

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Params')]").click();
    cy.focusCodeInput(apiwidget.queryKey);
    cy.wait("@saveAction");

    _.entityExplorer.SelectEntityByName("Rest_Api_2");

    cy.wait(1000);
    cy.xpath("//span[contains(text(), 'Headers')]").click();
    cy.updateCodeInput(apiwidget.headerValue, "test");
    cy.wait("@saveAction");

    _.entityExplorer.SelectEntityByName("SQL_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.body", { ch: 5, line: 0 });
    cy.wait("@saveAction");

    _.entityExplorer.SelectEntityByName("S3_Query");

    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data", {
      ch: 2,
      line: 0,
    });
    cy.wait(1000);
    cy.wait("@saveAction");

    _.entityExplorer.SelectEntityByName("JSObject1");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 4, line: 4 });
    cy.wait("@saveAction");

    _.entityExplorer.SelectEntityByName("JSObject2");

    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 2, line: 2 });

    _.entityExplorer.SelectEntityByName("Mongo_Query");

    cy.wait(1000);
    _.dataSources.EnterJSContext({
      fieldProperty: _.dataSources._mongoCollectionPath,
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
    _.entityExplorer.SelectEntityByName("Graphql_Query");

    cy.xpath("//span[contains(text(), 'Body')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    _.entityExplorer.SelectEntityByName("Rest_Api_1");
    // cy.assertCursorOnCodeInput(apiwidget.headerValue);

    _.entityExplorer.SelectEntityByName("Rest_Api_2");

    cy.xpath("//span[contains(text(), 'Headers')]/parent::button").should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.assertCursorOnCodeInput(apiwidget.headerValue);

    //Maintains focus on Query panes
    _.entityExplorer.SelectEntityByName("SQL_Query");

    cy.assertCursorOnCodeInput(".t--actionConfiguration\\.body", {
      ch: 5,
      line: 0,
    });

    _.entityExplorer.SelectEntityByName("S3_Query");

    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.bucket\\.data",
      { ch: 2, line: 0 },
    );

    // Removing as the Mongo collection is now converted to dropdown
    // _.entityExplorer.SelectEntityByName("Mongo_Query");

    // cy.assertCursorOnCodeInput(
    //   ".t--actionConfiguration\\.formData\\.collection\\.data",
    // );

    //Maintains focus on JS Objects
    _.entityExplorer.SelectEntityByName("JSObject1");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 4 });

    _.entityExplorer.SelectEntityByName("JSObject2");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("3. Check if selected tab on right tab persists", () => {
    _.entityExplorer.SelectEntityByName("Rest_Api_1", "Queries/JS");
    _.apiPage.SelectRightPaneTab("Connections");
    _.entityExplorer.SelectEntityByName("SQL_Query");
    _.entityExplorer.SelectEntityByName("Rest_Api_1");
    _.apiPage.AssertRightPaneSelectedTab("Connections");

    //Check if the URL is persisted while switching pages
    cy.Createpage("Page2");

    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Rest_Api_1", "Queries/JS");

    _.entityExplorer.SelectEntityByName("Page2", "Pages");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });

    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    cy.get(".t--nameOfApi .bp3-editable-text-content").should(
      "contain",
      "Rest_Api_1",
    );
  });

  it("4. Datasource edit mode has to be maintained", () => {
    _.entityExplorer.SelectEntityByName("Appsmith", "Datasources");
    _.dataSources.EditDatasource();
    _.agHelper.GoBack();
    _.entityExplorer.SelectEntityByName("Github", "Datasources");
    _.dataSources.AssertDSEditViewMode("View");
    _.entityExplorer.SelectEntityByName("Appsmith", "Datasources");
    _.dataSources.AssertDSEditViewMode("Edit");
  });

  it("5. Maintain focus of form control inputs", () => {
    _.entityExplorer.SelectEntityByName("SQL_Query");
    _.dataSources.ToggleUsePreparedStatement(false);
    _.entityExplorer.SelectEntityByName("S3_Query");

    cy.xpath(queryLocators.querySettingsTab).click();
    cy.setQueryTimeout(10000);

    _.entityExplorer.SelectEntityByName("SQL_Query");
    cy.get(".bp3-editable-text-content").should("contain.text", "SQL_Query");
    cy.get(".t--form-control-SWITCH input").should("be.focused");
    _.entityExplorer.SelectEntityByName("S3_Query");
    _.agHelper.Sleep();
    cy.xpath(queryLocators.querySettingsTab).click();
    cy.xpath(queryLocators.queryTimeout).should("be.focused");
  });

  it("6. Bug 21999 Maintain focus of code editor when Escape is pressed with autcomplete open + Bug 22960", () => {
    _.entityExplorer.SelectEntityByName("JSObject1");

    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 4 });
    cy.get(_.locators._codeMirrorTextArea).type("showA");
    _.agHelper.GetNAssertElementText(_.locators._hints, "showAlert()");
    _.agHelper.PressEscape();
    cy.assertCursorOnCodeInput(".js-editor", { ch: 7, line: 4 });

    //Bug 22960 Maintain focus of code editor when Escape is pressed
    _.agHelper.PressEscape();
    cy.assertCursorOnCodeInput(".js-editor", { ch: 7, line: 4 });
  });
});
