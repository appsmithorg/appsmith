import * as _ from "../../../../../support/Objects/ObjectsCore";

let wsName: string;
let appName: string;
let repoName: any;

describe(
  "Git Connect V2",
  {
    tags: [
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    before(() => {
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        wsName = "GitStatusLite" + uid;
        appName = "GitStatusLite" + uid;
        _.homePage.CreateNewWorkspace(wsName, true);
        _.homePage.CreateAppInWorkspace(wsName, appName);
        _.gitSync.CreateNConnectToGit();
        cy.get("@gitRepoName").then((repName) => {
          repoName = repName;
        });
      });
    });

    it("Issue 26038 : No simultaneous git status and remote compare api calls on commit modal", function () {
      cy.get(_.gitSync.locators.quickActionsPullBtn).should("be.visible");

      cy.intercept({
        method: "GET",
        url: "/api/v1/git/status/app/**",
        query: { compareRemote: "true" },
      }).as("gitStatusApi");

      _.agHelper.GetNClick(_.locators._publishButton);

      cy.wait("@gitStatusApi").then((res1) => {
        expect(res1.response).to.have.property("statusCode", 200);
        _.agHelper.GetNClick(_.locators._dialogCloseButton);
      });
    });

    after(() => {
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
