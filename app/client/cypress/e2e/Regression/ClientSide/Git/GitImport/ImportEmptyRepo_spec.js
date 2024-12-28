import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Git import empty repository",
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
    let repoName;
    const assertConnectFailure = true;
    const failureMessage =
      "git import failed. \nDetails: Cannot import app from an empty repo";
    before(() => {
      _.homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      });
      cy.generateUUID().then((uid) => {
        repoName = uid;
        _.gitSync.CreateTestGiteaRepo(repoName);
      });
    });

    it("1. Bug #12749 Git Import - Empty Repo NullPointerException", () => {
      cy.generateUUID().then((uid) => {
        repoName = uid;
        _.gitSync.CreateTestGiteaRepo(repoName);
        _.gitSync.ImportAppFromGit(undefined, repoName, false);
        cy.wait("@importFromGit").then((interception) => {
          const status = interception.response.body.responseMeta.status;
          const message = interception.response.body.responseMeta.error.message;
          expect(status).to.be.gte(400);
          expect(message).to.contain(failureMessage);
          _.gitSync.CloseConnectModal();
        });
      });
    });
    after(() => {
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
