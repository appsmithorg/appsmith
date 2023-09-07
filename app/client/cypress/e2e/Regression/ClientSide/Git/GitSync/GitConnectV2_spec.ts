import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Git Connect V2", function () {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.homePage.CreateNewWorkspace("GitConnectV2" + uid, true);
      _.homePage.CreateAppInWorkspace("GitConnectV2" + uid);
    });
  });

  it("Test Git Connect V2", function () {
    featureFlagIntercept({
      release_git_connect_v2_enabled: true,
    });
    _.gitSync.CreateNConnectToGitV2();
    featureFlagIntercept({
      release_git_connect_v2_enabled: false,
    });
  });
});
