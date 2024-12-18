import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe(
  "Bug 19893: Authenticated API DS in case of OAuth2, should have save and authorise button enabled all the times",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Create Auth API DS, save i, now edit again and check the save and authorise button state", function () {
      _.dataSources.NavigateToDSCreateNew();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dsName = "AuthAPI " + uid;
        _.dataSources.CreatePlugIn("Authenticated API");
        _.agHelper.RenameDatasource(dsName);
        _.dataSources.FillAuthAPIUrl();
        _.dataSources.AssertCursorPositionForTextInput(
          _.dataSources._urlInputControl,
          "{moveToStart}",
          "localhost",
          9,
        );
      });
    });
  },
);
