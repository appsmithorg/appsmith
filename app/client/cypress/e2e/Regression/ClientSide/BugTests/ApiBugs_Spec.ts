import {
  agHelper,
  locators,
  entityItems,
  apiPage,
  dataSources,
  debuggerHelper,
  dataManager,
  propPane,
  table,
  draggableWidgets,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "API Bugs",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Bug 14037, 25432: User gets an error even when table widget is added from the API page successfully", function () {
      // Case where api returns array response
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      apiPage.RunAPI();
      dataSources.AddSuggestedWidget(Widgets.Table);
      debuggerHelper.AssertErrorCount(0);
      table.WaitUntilTableLoad(0, 0, "v2");
      propPane.AssertPropertiesDropDownCurrentValue("Table data", "Api1");

      // Create another API so that it returns object response
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiObjectUrl,
      );
      apiPage.RunAPI();
      dataSources.AddSuggestedWidget(Widgets.Table);
      table.WaitUntilTableLoad(0, 0, "v2");
      propPane.ValidatePropertyFieldValue("Table data", "{{Api2.data.users}}");
    });

    it("2. Bug 16377, When Api url has dynamic binding expressions, ensure the url and path derived is not corrupting Api execution", function () {
      //Since the specified expression always returns true - it will never run mock-apis - which actually doesn't exist
      const apiUrl = `http://host.docker.internal:5001/v1/{{true ? 'mock-api' : 'mock-apis'}}?records=10`;

      apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
      agHelper.VerifyEvaluatedValue(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      apiPage.RunAPI();
      agHelper.AssertElementAbsence(
        locators._specificToast(
          Cypress.env("MESSAGES").ERROR_ACTION_EXECUTE_FAIL(
            "BindingExpressions",
          ),
        ),
      ); //Assert that an error is not returned.
      apiPage.ResponseStatusCheck("200 OK");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("3. Bug 18876 Ensures application does not crash when saving datasource", () => {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "FirstAPI",
        10000,
        "POST",
      );
      apiPage.SelectPaneTab("Authentication");
      cy.get(apiPage._saveAsDS).last().click({ force: true });
      cy.go("back");
      cy.get(dataSources._datasourceModalSave).click();
      // ensures app does not crash and datasource is saved.
      cy.contains("Edit datasource to access authentication settings").should(
        "exist",
      );
    });

    it("4. Bug 16683, When Api url has dynamic binding expressions, ensures the query params is not truncated", function () {
      const apiUrl = `http://host.docker.internal:5001/v1/mock-api?records=4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}`;

      apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
      apiPage.ValidateQueryParams({
        key: "records",
        value: "4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}",
      });
    });

    it("5. Bug 26897, Invalid binding of table data when used existing suggested widgets for an action returning object & array", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);

      // Case where api returns array response
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "ARRAY_RESPONSE",
      );
      apiPage.RunAPI();
      dataSources.AddSuggestedWidget(
        Widgets.Table,
        dataSources._addSuggestedExisting,
      );
      debuggerHelper.AssertErrorCount(0);
      table.WaitUntilTableLoad(0, 0, "v2");
      propPane.AssertPropertiesDropDownCurrentValue(
        "Table data",
        "ARRAY_RESPONSE",
      );

      // Create API so that it returns object response
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiObjectUrl,
        "OBJECT_RESPONSE",
      );
      apiPage.RunAPI();
      dataSources.AddSuggestedWidget(
        Widgets.Table,
        dataSources._addSuggestedExisting,
      );
      table.WaitUntilTableLoad(0, 0, "v2");
      propPane.ValidatePropertyFieldValue(
        "Table data",
        "{{OBJECT_RESPONSE.data.users}}",
      );
    });
  },
);
