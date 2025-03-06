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
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
const myDsName = "HubspotDS";

describe(
  "Hubspot Basic Tests",
  {
    tags: [
      "@tag.Datasource",
      "@tag.Git",
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
      dataSources.FillHubspotDSForm();
      dataSources.SaveDatasource();
    });

    it("2. Validate creating & running queries for the datasource", () => {
      // Create and run a SELECT query, validating the response views
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

      const fireApi = (retries = 5, responseTimeout = 100000) => {
        if (retries === 0) {
          throw new Error("Max retries reached, API did not return success.");
        }

        dataSources.RunQuery({
          toValidateResponse: false,
        });
        cy.wait(assertHelper.GetAliasName("@postExecute"), {
          timeout: responseTimeout,
        })
          .then((interceptions) => {
            return cy
              .get(assertHelper.GetAliasName("@postExecute"), {
                timeout: responseTimeout,
              })
              .its("response");
          })
          .then((response) => {
            const { isExecutionSuccess } = response.body.data;

            if (!isExecutionSuccess) {
              cy.log(`Retrying... Attempts left: ${retries - 1}`);
              assertHelper.Sleep();
              fireApi(retries - 1);
            } else {
              expect(isExecutionSuccess).to.eq(true);
            }
          });
      };

      fireApi(5);
      // PageLeftPane.switchSegment(PagePaneSegment.UI); // Switching the tab to ensure connection reset from Hubspot platform gets refreshed
      // PageLeftPane.switchSegment(PagePaneSegment.Queries);
      cy.get("@postExecute").then((resObj: any) => {
        const json = resObj.response.body.data.body;
        const name = json.name;
        cy.log("Name is :" + name);
        expect(name).to.equal("appsmith1"); //Verify if record contains the table
      });
    });

    it("3. Validate widget binding with queries & deploying the app", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
      propPane.EnterJSContext("Text", "{{Api1.data}}");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertElementVisibility(appSettings.locators._header);
      //agHelper.RefreshPage(); // Refreshing the page due to frequent connection reset from Hubspot
      // Assert that the text widget contains the expected data
      cy.get(locators._widgetInDeployed(draggableWidgets.TEXT)).should(
        "contain.text",
        "appsmith1",
      );
      // agHelper
      //   .GetElement(locators._widgetInDeployed(draggableWidgets.TEXT))
      //   .then(($elements) => {
      //     const values = $elements
      //       .map((_, el) => Cypress.$(el).text().trim())
      //       .get();
      //     expect(values).to.include("appsmith1");
      //   });
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
    it("5. Validate connection error when misconfiguring datasource", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("HubSpot");
      agHelper.GetNAssertContains(locators._dsName, "Untitled datasource 1");
      agHelper.AssertElementVisibility(dataSources._datasourceCard, true);
      dataSources.FillHubspotDSForm(undefined, "wrongpassword");
      dataSources.SaveDatasource(false);
      dataSources.CreateQueryForDS("Untitled datasource 1");
      agHelper.RefreshPage(); // Refreshing the page due to frequent connection reset from Hubspot
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
    });
  },
);
