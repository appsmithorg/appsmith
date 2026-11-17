import {
  agHelper,
  appSettings,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";
const myDsName = "HubspotDS";
const placeholderToken = "pat-na1-cypress-placeholder";

// Hubspot queries run through cloud services against the live Hubspot API.
// The stub keeps the spec on Appsmith's own behavior, independent of Hubspot's
// availability and of the test account's credentials.
const stubHubspotExecute = (fixture: string) =>
  cy
    .intercept("POST", "/api/v1/actions/execute", { fixture })
    .as("postExecute");

describe(
  "Hubspot Basic Tests",
  {
    tags: [
      "@tag.Datasource",
      "@tag.AccessControl",
      "@tag.Hubspot",
      "@tag.excludeForAirgap",
    ],
  },
  () => {
    it("1. Validate the configuration of Hubspot datasource", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("HubSpot");
      agHelper.AssertElementVisibility(dataSources._imgHubspotLogo, true, 0); // Ensure the Hubspot logo is visible
      agHelper.GetNAssertContains(locators._dsName, "Untitled datasource 1");

      // Attempt to rename the datasource with invalid and valid names
      agHelper.GetNClick(locators._dsName);
      agHelper.ClearTextField(locators._dsNameTxt, true);
      agHelper.AssertTooltip("Please enter a valid name");
      agHelper.PressEnter();
      agHelper.ValidateToastMessage("Invalid name");
      agHelper.GetNClick(locators._dsName);
      agHelper.TypeText(locators._dsNameTxt, myDsName);
      agHelper.PressEnter();
      agHelper.AssertElementVisibility(dataSources._datasourceCard, true);
      // Fill out the Hubspot configuration form and save the datasource
      dataSources.FillHubspotDSForm(undefined, placeholderToken);
      dataSources.SaveDatasource();
    });

    it("2. Validate creating & running queries for the datasource", () => {
      stubHubspotExecute("hubspot_POST_Execute.json");
      dataSources.CreateQueryForDS("HubspotDS");
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Please select an option",
        "HubDB - get details of a published table",
      );
      agHelper.EnterValue("appsmith1", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Table ID or name",
      });
      dataSources.RunQuery();
      cy.fixture("hubspot_POST_Execute.json").then((fixture) =>
        agHelper.AssertContains(
          fixture.data.body.name,
          "exist",
          BottomTabs.response.locators.responseDataContainer,
        ),
      );
    });

    it("3. Validate widget binding with queries & deploying the app", () => {
      stubHubspotExecute("hubspot_POST_Execute.json");
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
      propPane.EnterJSContext("Text", "{{Api1.data}}");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertElementVisibility(appSettings.locators._header);
      // Assert that the text widget contains the expected data
      cy.fixture("hubspot_POST_Execute.json").then((fixture) =>
        cy
          .get(locators._widgetInDeployed(draggableWidgets.TEXT))
          .should("contain.text", fixture.data.body.name),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Api1", EntityType.Query);
    });

    it("4. Validate deleting the datasource", () => {
      // Delete all queries associated with the datasource
      PageLeftPane.selectItem("Api1", { ctrlKey: true, force: true });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });

      // Delete the datasource and verify its removal
      dataSources.DeleteDatasourceFromWithinDS(myDsName, 409);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      cy.get(locators._widgetInDeployed(draggableWidgets.TEXT)).should(
        "have.text",
        "",
      );
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(myDsName, 200);
      agHelper.ValidateToastMessage(
        "HubspotDS datasource deleted successfully",
      );
    });
    it("5. Validate the query error shown for a misconfigured datasource", () => {
      stubHubspotExecute("hubspot_POST_Execute_Unauthorized.json");
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("HubSpot");
      agHelper.GetNAssertContains(locators._dsName, "Untitled datasource 1");
      agHelper.AssertElementVisibility(dataSources._datasourceCard, true);
      dataSources.FillHubspotDSForm(undefined, "wrongpassword");
      dataSources.SaveDatasource(false);
      dataSources.CreateQueryForDS("Untitled datasource 1");
      agHelper.RefreshPage();
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Please select an option",
        "HubDB - get details of a published table",
      );
      agHelper.EnterValue("appsmith1", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Table ID or name",
      });
      dataSources.RunQuery({
        expectedStatus: false,
        toValidateResponse: true,
      });
      cy.fixture("hubspot_POST_Execute_Unauthorized.json").then((fixture) =>
        agHelper.AssertContains(
          fixture.data.pluginErrorDetails.downstreamErrorMessage,
          "exist",
          dataSources._queryError,
        ),
      );
    });
  },
);
