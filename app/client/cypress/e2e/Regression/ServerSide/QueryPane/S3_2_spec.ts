/// <reference types="Cypress" />

import formControls from "../../../../locators/FormControl.json";
import {
  agHelper,
  dataSources,
  entityItems,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validate CRUD queries for Amazon S3 along with UI flow verifications",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let bucketName = "assets-test--appsmith",
      uid: any,
      datasourceName: any;
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      dataSources.StartDataSourceRoutes();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    // afterEach(function() {
    //   if (this.currentTest.state === "failed") {
    //     Cypress.runner.stop();
    //   }
    // });

    // afterEach(() => {
    //   if (queryName)
    //     cy.actionContextMenuByEntityName(queryName);
    // });

    before("Creates a new Amazon S3 datasource", function () {
      dataSources.CreateDataSource("S3");
      cy.get("@dsName").then((dsName) => {
        datasourceName = dsName;
      });
      agHelper.GenerateUUID();

      cy.get("@guid").then((guid) => {
        uid = guid;
      });
    });

    it("1. Verify 'Add to widget [Widget Suggestion]' functionality - S3", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      dataSources.CreateQueryForDS(datasourceName);

      agHelper.GetObjectName().then(($queryName) => {
        dataSources.ValidateNSelectDropdown("Command", "List files in bucket");
        agHelper.UpdateCodeInput(formControls.s3BucketName, bucketName);

        dataSources.RunQuery();
        dataSources.AddSuggestedWidget(Widgets.Dropdown);
        propPane.DeleteWidgetDirectlyFromPropertyPane();

        EditorNavigation.SelectEntityByName($queryName, EntityType.Query);
        dataSources.AddSuggestedWidget(Widgets.Table);
        table.WaitUntilTableLoad(0, 0, "v2");
        propPane.DeleteWidgetDirectlyFromPropertyPane();

        EditorNavigation.SelectEntityByName($queryName, EntityType.Query);
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Query,
        });
      });
    });

    after("Deletes the datasource", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, 409); //since crud page is still active
    });
  },
);
