import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let wsName: string;
let appName: string;
let repoName: any;

describe("Git Connect V2", function () {
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

  it("Issue 26038 - 1 : Simultaneous git status and remote compare api calls on commit modal", function () {
    featureFlagIntercept({
      release_git_status_lite_enabled: true,
    });

    cy.wait(1000);

    cy.intercept({
      method: "GET",
      url: "/api/v1/git/fetch/remote/app/**",
    }).as("gitRemoteStatusApi");

    cy.intercept({
      method: "GET",
      url: "/api/v1/git/status/app/**",
      query: { compareRemote: "false" },
    }).as("gitStatusApi");

    _.agHelper.GetNClick(_.locators._publishButton);

    cy.wait("@gitRemoteStatusApi").then((res1) => {
      expect(res1.response).to.have.property("statusCode", 200);
      cy.wait("@gitStatusApi").then((res2) => {
        expect(res2.response).to.have.property("statusCode", 200);

        _.agHelper.GetNClick(_.locators._dialogCloseButton);
      });
    });
  });

  it("Issue 26038 - 2 : Simultaneous git status and remote compare api calls on commit modal", function () {
    featureFlagIntercept({
      release_git_status_lite_enabled: false,
    });

    cy.wait(1000);

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

  it("Issue 28462 : Simultaneous git status and remote compare api calls on canvas load", function () {
    featureFlagIntercept({
      release_git_status_lite_enabled: true,
    });

    cy.wait(1000);

    cy.intercept({
      method: "GET",
      url: "/api/v1/git/fetch/remote/app/**",
    }).as("gitRemoteStatusApi");

    cy.intercept({
      method: "GET",
      url: "/api/v1/git/status/app/**",
      query: { compareRemote: "false" },
    }).as("gitStatusApi");

    cy.reload();

    cy.wait("@gitRemoteStatusApi").then((res1) => {
      expect(res1.response).to.have.property("statusCode", 200);
      cy.wait("@gitStatusApi").then((res2) => {
        expect(res2.response).to.have.property("statusCode", 200);
      });
    });
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
