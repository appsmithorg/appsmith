/// <reference types="Cypress" />
import { GSHEET_DATA } from "../../fixtures/test-data-gsheet";
import {
  homePage,
  gsheetHelper,
  dataSources,
  agHelper,
  entityExplorer,
  propPane,
  table,
  draggableWidgets,
} from "../../support/Objects/ObjectsCore";
import { Widgets } from "../../support/Pages/DataSources";
import oneClickBindingLocator from "../../locators/OneClickBindingLocator";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../support/Pages/EditorNavigation";

const workspaceName = "gsheet apps";
const dataSourceName = "gsheet-shared-selected";
let appName = "gsheet-app";
let spreadSheetName = "test-sheet-automation-selected";
describe(
  "GSheet-widget binding for selected sheet access",
  {
    tags: ["@tag.Datasource", "@tag.GSheet", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    before("Setup app and spreadsheet", function () {
      //Setting up the app name
      const uuid = Cypress._.random(0, 10000);
      appName = appName + "-" + uuid;

      //Adding app and data to the selected sheet
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceName);
      homePage.CreateAppInWorkspace(workspaceName);
      homePage.RenameApplication(appName);
      gsheetHelper.AddInsertOrUpdateQuery(
        "Insert Many",
        dataSourceName,
        spreadSheetName,
        JSON.stringify(GSHEET_DATA),
      );
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.body.message).to.deep.equal(
          "Inserted rows successfully!",
        );
      });
    });

    it("1. Verify 'Add to widget [Widget Suggestion]' functionality for selected sheet access - GSheet", () => {
      //Adding query
      gsheetHelper.EnterBasicQueryValues(
        "Fetch Many",
        dataSourceName,
        spreadSheetName,
      );
      dataSources.runQueryAndVerifyResponseViews({ count: 10 });

      // Adding suggested widgets and verify
      dataSources.AddSuggestedWidget(Widgets.Table);
      agHelper.RefreshPage();
      table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
        expect(cellData).to.eq("eac7efa5dbd3d667f26eb3d3ab504464");
      });
      agHelper.GetNClick(propPane._deleteWidget);
    });

    it("2. One click binding to table widget functionality for selected sheet access - GSheet", () => {
      //Adding table widget
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);
      agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
      agHelper.GetNClick(
        oneClickBindingLocator.datasourceQuerySelector("fetch_many_query"),
      );

      // Assert table data
      table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
        expect(cellData).to.eq("eac7efa5dbd3d667f26eb3d3ab504464");
      });
      agHelper.GetNClick(propPane._deleteWidget);
    });

    after("Delete app", function () {
      // Delete data in spreadsheet and app
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      gsheetHelper.EnterBasicQueryValues(
        "Delete One",
        dataSourceName,
        spreadSheetName,
      );
      GSHEET_DATA.reverse().forEach((d) => {
        agHelper.EnterValue(d.rowIndex, {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Row Index",
        });
        dataSources.RunQuery();
        cy.get("@postExecute").then((interception: any) => {
          expect(interception.response.body.data.body.message).to.deep.equal(
            "Deleted row successfully!",
          );
        });
        agHelper.Sleep(500);
      });
      homePage.NavigateToHome();
      homePage.DeleteApplication(appName);
    });
  },
);
