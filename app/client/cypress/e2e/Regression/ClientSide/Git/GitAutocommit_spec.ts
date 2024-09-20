import ReconnectLocators from "../../../../locators/ReconnectLocators";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  gitSync,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

let wsName: string;
let repoName: string = "TED-testrepo1";

describe(
  "Git Autocommit",
  {
    tags: [
      "@tag.Git",
      "@tag.GitAutocommit",
      "@tag.excludeForAirgap",
      "@tag.Sanity",
    ],
  },
  function () {
    it("Check if autocommit progress bar is visible and network requests are properly called", function () {
      featureFlagIntercept({
        release_git_autocommit_feature_enabled: true,
      });
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        wsName = "GitAC-" + uid;
        homePage.CreateNewWorkspace(wsName, true);

        cy.intercept({
          method: "POST",
          url: "/api/v1/git/auto-commit/app/*",
        }).as("gitAutocommitTriggerApi");

        cy.intercept(
          {
            method: "GET",
            url: "/api/v1/git/auto-commit/progress/app/*",
          },
          (req) => {
            req.on("response", (res) => {
              res.setDelay(500);
            });
          },
        ).as("gitAutocommitProgressApi");

        gitSync.ImportAppFromGit(wsName, repoName);
        agHelper.GetNClick(ReconnectLocators.SkipToAppBtn);
        cy.wait("@gitAutocommitTriggerApi").then((interception) => {
          expect(interception?.response?.statusCode).to.equal(200);
          expect(
            interception?.response?.body?.data?.autoCommitResponse,
          ).to.equal("PUBLISHED");
          agHelper.WaitUntilEleAppear(gitSync._autocommitStatusbar);
        });
        cy.wait("@gitAutocommitProgressApi").then((interceptions) => {
          expect(interceptions?.response?.statusCode).to.equal(200);
        });
      });
    });
  },
);
