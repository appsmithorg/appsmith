/// <reference types="cypress-tags" />

import * as _ from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("excludeForAirgap", "Query pane navigation", () => {
  let ds1Name: string;
  let ds2Name: string;

  beforeEach("Add dsl and create datasource", () => {
    _.dataSources.CreateDataSource("S3", true, false);
    cy.get("@dsName").then(($dsName) => {
      ds1Name = $dsName as unknown as string;
    });
    _.dataSources.CreateDataSource("Firestore", true, false);
    cy.get("@dsName").then(($dsName) => {
      ds2Name = $dsName as unknown as string;
    });
  });

  it("Switching between S3 query and firestore query", () => {
    _.entityExplorer.CreateNewDsQuery(ds1Name);
    _.agHelper.EnterValue("{{test}}", {
      propFieldName:
        ".t--actionConfiguration\\.formData\\.list\\.sortBy\\.data\\[0\\]\\.column",
      directInput: true,
      inputFieldName: "",
    });
    _.agHelper.UpdateCodeInput(
      ".t--actionConfiguration\\.formData\\.bucket\\.data",
      "test",
    );
    _.debuggerHelper.AssertErrorCount(1);

    cy.get("@dsName").then(($dsName) => {
      ds2Name = $dsName as unknown as string;
    });
    _.entityExplorer.CreateNewDsQuery(ds2Name);
    _.agHelper.UpdateCodeInput(
      ".t--actionConfiguration\\.formData\\.limitDocuments\\.data",
      "{{test}}",
    );
    _.agHelper.UpdateCodeInput(
      ".t--actionConfiguration\\.formData\\.path\\.data",
      "test",
    );
    _.debuggerHelper.AssertErrorCount(2);

    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClicklogEntityLink();
    _.agHelper.AssertElementVisibility(
      ".t--actionConfiguration\\.formData\\.limitDocuments\\.data",
    );

    _.debuggerHelper.ClicklogEntityLink(true);
    _.agHelper.AssertElementVisibility(
      ".t--actionConfiguration\\.formData\\.list\\.sortBy\\.data\\[0\\]\\.column",
    );

    _.dataSources.DeleteDSFromEntityExplorer(ds1Name);
    _.dataSources.DeleteDSFromEntityExplorer(ds2Name);
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      entityType: EntityItems.Query,
    });
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query2",
      entityType: EntityItems.Query,
    });
  });
});
